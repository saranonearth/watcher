import { Service } from "typedi";

@Service()
export class AppService {
    public root() {
        return {
            application: "watcher",
            status: "running",
            timestamp: new Date(),
        };
    }
}
