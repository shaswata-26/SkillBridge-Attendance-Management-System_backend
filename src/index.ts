import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`SkillBridge API running on port ${env.PORT}`);
});
