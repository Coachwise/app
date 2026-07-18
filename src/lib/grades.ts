// Climbing grade scales for logging. Stored verbatim as the string in
// workout_logs.grade (e.g. "V4", "7a").

// Bouldering (Hueco / V-scale): V0–V17.
export const V_GRADES = Array.from({ length: 18 }, (_, i) => `V${i}`);

// Routes (Fontainebleau / French sport): 4 through 9c.
export const FONT_GRADES = [
  '4', '5', '5+',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b', '9b+', '9c',
];
