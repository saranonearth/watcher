import { Controller, GET } from "fastify-decorators";
import { Inject } from "typedi";
import { AppService } from "./app.service.js";

@Controller("/")
export default class AppController {
    constructor(
        @Inject() private appService: AppService
    ) {}

    @GET()
    async root() {
        return this.appService.root();
    }
}