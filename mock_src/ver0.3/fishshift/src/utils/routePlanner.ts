import type { OceanGridCell, PointLatLon, Region, VesselParams } from '../types/ocean';
import { estimateSegmentKinematics, haversineKm } from './oceanMath';

const KNOT_TO_KMH = 1.852;
const ROUTE_ROWS = 40;
const ROUTE_COLS = 52;

export function pointInPolygon(pt: PointLatLon, poly: PointLatLon[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lon;
    const yi = poly[i].lat;
    const xj = poly[j].lon;
    const yj = poly[j].lat;
    const intersect =
      yi > pt.lat !== yj > pt.lat &&
      pt.lon < ((xj - xi) * (pt.lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function orientation(p: PointLatLon, q: PointLatLon, r: PointLatLon): number {
  const val = (q.lon - p.lon) * (r.lat - q.lat) - (q.lat - p.lat) * (r.lon - q.lon);
  if (Math.abs(val) < 1e-11) return 0;
  return val > 0 ? 1 : 2;
}

function onSegment(p: PointLatLon, q: PointLatLon, r: PointLatLon): boolean {
  return (
    q.lon <= Math.max(p.lon, r.lon) + 1e-11 &&
    q.lon >= Math.min(p.lon, r.lon) - 1e-11 &&
    q.lat <= Math.max(p.lat, r.lat) + 1e-11 &&
    q.lat >= Math.min(p.lat, r.lat) - 1e-11
  );
}

function segmentsIntersect(a: PointLatLon, b: PointLatLon, c: PointLatLon, d: PointLatLon): boolean {
  if (
    Math.max(a.lon, b.lon) < Math.min(c.lon, d.lon) - 1e-11 ||
    Math.min(a.lon, b.lon) > Math.max(c.lon, d.lon) + 1e-11 ||
    Math.max(a.lat, b.lat) < Math.min(c.lat, d.lat) - 1e-11 ||
    Math.min(a.lat, b.lat) > Math.max(c.lat, d.lat) + 1e-11
  ) {
    return false;
  }

  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;
  return false;
}

export function segmentIntersectsPolygon(
  a: PointLatLon,
  b: PointLatLon,
  poly: PointLatLon[]
): boolean {
  if (poly.length < 3) return false;
  if (pointInPolygon(a, poly) || pointInPolygon(b, poly)) return true;

  // Interior sample checks catch collinear/vertex-grazing crossings
  for (const t of [0.25, 0.5, 0.75]) {
    const pt = { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
    if (pointInPolygon(pt, poly)) return true;
  }

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (segmentsIntersect(a, b, poly[j], poly[i])) return true;
  }
  return false;
}

export function segmentCrossesLand(
  landPolygons: PointLatLon[][],
  a: PointLatLon,
  b: PointLatLon
): boolean {
  return landPolygons.some((poly) => segmentIntersectsPolygon(a, b, poly));
}

class MinHeap {
  private nodes: number[] = [];
  private scores: Float64Array;

  constructor(scores: Float64Array) {
    this.scores = scores;
  }

  get size(): number {
    return this.nodes.length;
  }

  push(node: number): void {
    this.nodes.push(node);
    this.bubbleUp(this.nodes.length - 1);
  }

  pop(): number {
    const top = this.nodes[0];
    const last = this.nodes.pop()!;
    if (this.nodes.length > 0) {
      this.nodes[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(idx: number): void {
    const node = this.nodes[idx];
    const score = this.scores[node];
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      const parent = this.nodes[parentIdx];
      if (score >= this.scores[parent]) break;
      this.nodes[idx] = parent;
      idx = parentIdx;
    }
    this.nodes[idx] = node;
  }

  private sinkDown(idx: number): void {
    const len = this.nodes.length;
    const node = this.nodes[idx];
    const score = this.scores[node];
    while (true) {
      const left = (idx << 1) + 1;
      const right = left + 1;
      let smallest = idx;
      if (left < len && this.scores[this.nodes[left]] < score) {
        smallest = left;
      }
      if (
        right < len &&
        this.scores[this.nodes[right]] < this.scores[this.nodes[smallest]]
      ) {
        smallest = right;
      }
      if (smallest === idx) break;
      this.nodes[idx] = this.nodes[smallest];
      idx = smallest;
    }
    this.nodes[idx] = node;
  }
}

const NEIGHBOR_OFFSETS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
  [-2, -1],
  [-2, 1],
  [2, -1],
  [2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
];

function smoothShortestPath(
  path: PointLatLon[],
  landPolygons: PointLatLon[][]
): PointLatLon[] {
  if (path.length <= 2) return path;
  const smoothed: PointLatLon[] = [path[0]];
  let i = 0;
  while (i < path.length - 1) {
    let furthest = i + 1;
    for (let j = path.length - 1; j > i + 1; j--) {
      if (!segmentCrossesLand(landPolygons, path[i], path[j])) {
        furthest = j;
        break;
      }
    }
    smoothed.push(path[furthest]);
    i = furthest;
  }
  return smoothed;
}

function smoothFuelPath(
  path: PointLatLon[],
  landPolygons: PointLatLon[][],
  projectedGrid: OceanGridCell[],
  vessel: VesselParams
): PointLatLon[] {
  if (path.length <= 2) return path;

  // Prefix sum of exact modeled fuel along raw path segments
  const prefixFuel = new Array<number>(path.length).fill(0);
  for (let k = 0; k < path.length - 1; k++) {
    prefixFuel[k + 1] =
      prefixFuel[k] +
      estimateSegmentKinematics(path[k], path[k + 1], projectedGrid, vessel).segFuel;
  }

  const smoothed: PointLatLon[] = [path[0]];
  let i = 0;
  while (i < path.length - 1) {
    let chosen = i + 1;
    for (let j = path.length - 1; j > i + 1; j--) {
      if (segmentCrossesLand(landPolygons, path[i], path[j])) continue;
      const directFuel = estimateSegmentKinematics(
        path[i],
        path[j],
        projectedGrid,
        vessel
      ).segFuel;
      const rawFuel = prefixFuel[j] - prefixFuel[i];
      if (directFuel <= rawFuel * 1.001) {
        chosen = j;
        break;
      }
    }
    smoothed.push(path[chosen]);
    i = chosen;
  }
  return smoothed;
}

function runAStar(
  region: Region,
  origin: PointLatLon,
  dest: PointLatLon,
  mode: 'distance' | 'fuel',
  projectedGrid?: OceanGridCell[],
  vessel?: VesselParams
): PointLatLon[] {
  const { west, south, east, north } = region.bbox;
  const dLat = (north - south) / ROUTE_ROWS;
  const dLon = (east - west) / ROUTE_COLS;
  const gridCount = ROUTE_ROWS * ROUTE_COLS;
  const START = gridCount;
  const GOAL = gridCount + 1;
  const totalNodes = gridCount + 2;

  const nodeCoords: PointLatLon[] = new Array(totalNodes);
  const walkable = new Uint8Array(totalNodes);

  for (let r = 0; r < ROUTE_ROWS; r++) {
    for (let c = 0; c < ROUTE_COLS; c++) {
      const idx = r * ROUTE_COLS + c;
      const pt = {
        lat: north - (r + 0.5) * dLat,
        lon: west + (c + 0.5) * dLon,
      };
      nodeCoords[idx] = pt;
      const onLand = region.landPolygons.some((poly) => pointInPolygon(pt, poly));
      walkable[idx] = onLand ? 0 : 1;
    }
  }
  nodeCoords[START] = origin;
  nodeCoords[GOAL] = dest;
  walkable[START] = 1;
  walkable[GOAL] = 1;

  // Find grid cells around START and GOAL that have unobstructed water line-of-sight
  const collectVisibleAnchors = (pt: PointLatLon): number[] => {
    const r0 = Math.max(0, Math.min(ROUTE_ROWS - 1, Math.floor((north - pt.lat) / dLat)));
    const c0 = Math.max(0, Math.min(ROUTE_COLS - 1, Math.floor((pt.lon - west) / dLon)));
    const local: number[] = [];
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -3; dc <= 3; dc++) {
        const nr = r0 + dr;
        const nc = c0 + dc;
        if (nr < 0 || nr >= ROUTE_ROWS || nc < 0 || nc >= ROUTE_COLS) continue;
        const nIdx = nr * ROUTE_COLS + nc;
        if (walkable[nIdx] && !segmentCrossesLand(region.landPolygons, pt, nodeCoords[nIdx])) {
          local.push(nIdx);
        }
      }
    }
    if (local.length > 0) return local;

    // Fallback: closest visible sea nodes across whole grid
    const ranked: { idx: number; d: number }[] = [];
    for (let i = 0; i < gridCount; i++) {
      if (!walkable[i]) continue;
      if (!segmentCrossesLand(region.landPolygons, pt, nodeCoords[i])) {
        ranked.push({ idx: i, d: haversineKm(pt, nodeCoords[i]) });
      }
    }
    ranked.sort((a, b) => a.d - b.d);
    return ranked.slice(0, 8).map((x) => x.idx);
  };

  const startNeighbors = collectVisibleAnchors(origin);
  const goalAnchors = new Set<number>(collectVisibleAnchors(dest));

  // Admissible lower-bound fuel factor for A* heuristic
  const maxPossibleSpeedKnots = vessel ? vessel.speedKnots + 8.0 : 20.0;
  const minFuelPerKm = vessel
    ? (0.9 * vessel.fuelLitersPerHour) / (maxPossibleSpeedKnots * KNOT_TO_KMH)
    : 0;

  const edgeCost = (a: PointLatLon, b: PointLatLon): number => {
    if (mode === 'fuel' && projectedGrid && vessel) {
      return estimateSegmentKinematics(a, b, projectedGrid, vessel).segFuel;
    }
    return haversineKm(a, b);
  };

  const heuristic = (pt: PointLatLon): number => {
    const dKm = haversineKm(pt, dest);
    return mode === 'fuel' && projectedGrid && vessel ? dKm * minFuelPerKm : dKm;
  };

  const gScore = new Float64Array(totalNodes).fill(Infinity);
  const fScore = new Float64Array(totalNodes).fill(Infinity);
  const cameFrom = new Int32Array(totalNodes).fill(-1);
  const closed = new Uint8Array(totalNodes);

  gScore[START] = 0;
  fScore[START] = heuristic(origin);

  const open = new MinHeap(fScore);
  open.push(START);

  const tryRelax = (u: number, v: number) => {
    if (closed[v] || !walkable[v]) return;
    if (segmentCrossesLand(region.landPolygons, nodeCoords[u], nodeCoords[v])) return;
    const tentativeG = gScore[u] + edgeCost(nodeCoords[u], nodeCoords[v]);
    if (tentativeG < gScore[v]) {
      cameFrom[v] = u;
      gScore[v] = tentativeG;
      fScore[v] = tentativeG + (v === GOAL ? 0 : heuristic(nodeCoords[v]));
      open.push(v);
    }
  };

  while (open.size > 0) {
    const current = open.pop();
    if (current === GOAL) {
      const raw: PointLatLon[] = [];
      let cur = GOAL;
      while (cur !== -1) {
        raw.push(nodeCoords[cur]);
        cur = cameFrom[cur];
      }
      raw.reverse();
      if (mode === 'fuel' && projectedGrid && vessel) {
        return smoothFuelPath(raw, region.landPolygons, projectedGrid, vessel);
      }
      return smoothShortestPath(raw, region.landPolygons);
    }

    if (closed[current]) continue;
    closed[current] = 1;

    if (current === START) {
      if (!segmentCrossesLand(region.landPolygons, origin, dest)) {
        tryRelax(START, GOAL);
      }
      for (const nIdx of startNeighbors) {
        tryRelax(START, nIdx);
      }
      continue;
    }

    if (goalAnchors.has(current)) {
      tryRelax(current, GOAL);
    }

    const r = Math.floor(current / ROUTE_COLS);
    const c = current % ROUTE_COLS;
    for (const [dr, dc] of NEIGHBOR_OFFSETS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= ROUTE_ROWS || nc < 0 || nc >= ROUTE_COLS) continue;
      const nIdx = nr * ROUTE_COLS + nc;
      tryRelax(current, nIdx);
    }
  }

  // Fallback if origin or dest is completely landlocked
  return [origin, dest];
}

function pathFuel(
  path: PointLatLon[],
  projectedGrid: OceanGridCell[],
  vessel: VesselParams
): number {
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    sum += estimateSegmentKinematics(path[i], path[i + 1], projectedGrid, vessel).segFuel;
  }
  return sum;
}

export function planLandAvoidingRoutes(
  region: Region,
  origin: PointLatLon,
  dest: PointLatLon,
  projectedGrid?: OceanGridCell[],
  vessel?: VesselParams
): { routeA: PointLatLon[]; routeB: PointLatLon[] } {
  const routeA = runAStar(region, origin, dest, 'distance');
  let routeB =
    projectedGrid && vessel
      ? runAStar(region, origin, dest, 'fuel', projectedGrid, vessel)
      : routeA;

  if (projectedGrid && vessel) {
    const fuelA = pathFuel(routeA, projectedGrid, vessel);
    const fuelB = pathFuel(routeB, projectedGrid, vessel);
    if (fuelA < fuelB) {
      routeB = routeA;
    }
  }

  const formatPt = (pt: PointLatLon, isEndpoint: boolean): PointLatLon =>
    isEndpoint
      ? pt
      : { lat: Number(pt.lat.toFixed(4)), lon: Number(pt.lon.toFixed(4)) };

  return {
    routeA: routeA.map((p, i) => formatPt(p, i === 0 || i === routeA.length - 1)),
    routeB: routeB.map((p, i) => formatPt(p, i === 0 || i === routeB.length - 1)),
  };
}
