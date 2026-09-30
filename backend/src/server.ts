import { app } from "./app";
import { config } from "./config";

app.listen(config.PORT, () => {
  process.stdout.write(`Listening on :${config.PORT}\n`);
});
