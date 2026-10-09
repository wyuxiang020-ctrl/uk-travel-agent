import path from "node:path";

// Only source files contain UI classes. Keep generated files and reports out of HMR.
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: path.resolve(process.cwd(), "src"),
    },
  },
};
export default config;
