/** The fields whose value no longer matches the saved one, compared by their JSON form. */
export function dirtyKeys<T extends object>(
  values: T,
  initialValues: T
): (keyof T)[] {
  return (Object.keys(values) as (keyof T)[]).filter(
    (key) => JSON.stringify(values[key]) !== JSON.stringify(initialValues[key])
  );
}
