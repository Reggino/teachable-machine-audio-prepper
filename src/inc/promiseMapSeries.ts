export default async function promiseMapSeries(
  array: any[],
  cb: (arg: any) => Promise<any>
) {
  const length = array.length;
  const results = new Array(length);

  for (let i = 0; i < length; ++i) {
    results[i] = await cb(array[i]);
  }

  return results;
}
