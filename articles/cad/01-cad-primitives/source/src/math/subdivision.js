import { add3, average3, scale3 } from './linear.js';

function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function catmullClarkStep(mesh) {
  const { vertices, faces } = mesh;
  const facePoints = faces.map((face) => average3(face.map((index) => vertices[index])));
  const edgeMap = new Map();
  const vertexFaces = vertices.map(() => []);
  const vertexEdges = vertices.map(() => []);

  faces.forEach((face, faceIndex) => {
    face.forEach((vertexIndex) => vertexFaces[vertexIndex].push(faceIndex));
    for (let i = 0; i < face.length; i += 1) {
      const a = face[i];
      const b = face[(i + 1) % face.length];
      const key = edgeKey(a, b);
      if (!edgeMap.has(key)) edgeMap.set(key, { key, a: Math.min(a, b), b: Math.max(a, b), faces: [] });
      edgeMap.get(key).faces.push(faceIndex);
    }
  });

  const edges = [...edgeMap.values()];
  edges.forEach((edge, edgeIndex) => {
    vertexEdges[edge.a].push(edgeIndex);
    vertexEdges[edge.b].push(edgeIndex);
  });

  const edgeMidpoints = edges.map((edge) => scale3(add3(vertices[edge.a], vertices[edge.b]), 0.5));
  const edgePoints = edges.map((edge, edgeIndex) => {
    if (edge.faces.length < 2) return edgeMidpoints[edgeIndex];
    const sum = [
      vertices[edge.a],
      vertices[edge.b],
      facePoints[edge.faces[0]],
      facePoints[edge.faces[1]],
    ];
    return average3(sum);
  });

  const vertexPoints = vertices.map((point, vertexIndex) => {
    const incidentFaces = vertexFaces[vertexIndex];
    const incidentEdges = vertexEdges[vertexIndex];
    const boundaryEdges = incidentEdges.filter((edgeIndex) => edges[edgeIndex].faces.length < 2);

    if (boundaryEdges.length >= 2) {
      const boundaryNeighbors = boundaryEdges.map((edgeIndex) => {
        const edge = edges[edgeIndex];
        return vertices[edge.a === vertexIndex ? edge.b : edge.a];
      });
      const neighborAverage = average3(boundaryNeighbors);
      return add3(scale3(point, 0.75), scale3(neighborAverage, 0.25));
    }

    const n = incidentFaces.length;
    if (n === 0) return [...point];
    const faceAverage = average3(incidentFaces.map((faceIndex) => facePoints[faceIndex]));
    const edgeAverage = average3(incidentEdges.map((edgeIndex) => edgeMidpoints[edgeIndex]));
    return scale3(add3(add3(faceAverage, scale3(edgeAverage, 2)), scale3(point, n - 3)), 1 / n);
  });

  const newVertices = [
    ...vertexPoints.map((point) => [...point]),
    ...edgePoints.map((point) => [...point]),
    ...facePoints.map((point) => [...point]),
  ];
  const edgeOffset = vertexPoints.length;
  const faceOffset = edgeOffset + edgePoints.length;
  const edgeIndexByKey = new Map(edges.map((edge, index) => [edge.key, edgeOffset + index]));

  const newFaces = [];
  faces.forEach((face, faceIndex) => {
    const facePointIndex = faceOffset + faceIndex;
    for (let i = 0; i < face.length; i += 1) {
      const current = face[i];
      const next = face[(i + 1) % face.length];
      const previous = face[(i - 1 + face.length) % face.length];
      newFaces.push([
        current,
        edgeIndexByKey.get(edgeKey(current, next)),
        facePointIndex,
        edgeIndexByKey.get(edgeKey(previous, current)),
      ]);
    }
  });

  return {
    mesh: { vertices: newVertices, faces: newFaces },
    construction: {
      facePoints,
      edgePoints,
      edgeMidpoints,
      vertexPoints,
      edges,
      vertexFaces,
      vertexEdges,
      valence: vertexFaces.map((items) => items.length),
    },
  };
}

export function subdivideCatmullClark(mesh, levels) {
  let current = {
    vertices: mesh.vertices.map((point) => [...point]),
    faces: mesh.faces.map((face) => [...face]),
  };
  let firstConstruction = null;
  for (let level = 0; level < levels; level += 1) {
    const result = catmullClarkStep(current);
    if (level === 0) firstConstruction = result.construction;
    current = result.mesh;
  }
  if (!firstConstruction) firstConstruction = catmullClarkStep(current).construction;
  return { mesh: current, firstConstruction };
}
