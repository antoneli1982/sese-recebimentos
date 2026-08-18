export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return {
      shortCircuit: true,
      url: "data:text/javascript,export const env = {}; export class WorkerEntrypoint {}; export class DurableObject {}; export class WorkflowEntrypoint {};",
    };
  }
  return nextResolve(specifier, context);
}
