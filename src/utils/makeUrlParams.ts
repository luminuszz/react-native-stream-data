export function makeUrlParamsFactory(url: string, args: Record<string, any>) {
  const urlFactory = new URLSearchParams();

  Object.keys(args).forEach((item) => {
    urlFactory.set(item, args[item]);
  });

  const uri = decodeURIComponent(urlFactory.toString());

  return `${url}?${uri}`;
}
