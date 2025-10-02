module.exports = {
    apps: [
      {
        name: "next-app",
        script: "npm",
        args: "start",
        cwd: "./", // path to your project folder
        interpreter: "none",
        env: {
          NODE_ENV: "production"
        }
      }
    ]
  };
  