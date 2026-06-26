import { createDogeConnectApiDependencies } from "./create-dogeconnect-api-dependencies"
import { createDogeConnectApiApp } from "./elysia-app"

export const dogeConnectApiApp = createDogeConnectApiApp(createDogeConnectApiDependencies())
