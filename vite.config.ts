import { defineConfig } from "vite";

export default defineConfig({
	build: {
		outDir: "dist",
		sourcemap: true,
	},
	css: {
		preprocessorOptions: {
			scss: {
				// include-media is used in SCSS files
				additionalData: "",
			},
		},
	},
	server: {
		open: true,
	},
	// Env vars must use VITE_ prefix to be exposed to client code.
	// Legacy process.env.* references (MB_TOKEN, FIREBASE_*) need renaming
	// to import.meta.env.VITE_* — see PLAN.md Phase 1 item 2.
	envPrefix: "VITE_",
});
