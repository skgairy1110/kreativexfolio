/**
 * Backward-compatible entry point.
 *
 * The hero's particle engine was upgraded to the "Gravity Field" effect
 * (see ./GravityField.tsx), which owns all the actual canvas/animation
 * logic and configuration. This file just re-exports it under the original
 * names so NeuralNetworkHero.tsx and routes/index.tsx don't need to change.
 */
export { GravityField as ParticleNetwork } from "@/components/hero/GravityField";
export type { GravityFieldHandle as ParticleNetworkHandle } from "@/components/hero/GravityField";
