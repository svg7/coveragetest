import * as tape from "tape";
// import * as fs from "fs";
import { createSession } from "../index";
import { Profiler } from "../protocol/tot";
import { HeapProfiler } from "../protocol/tot";
// import { Page } from "../protocol/tot";

tape("test debugging protocol domains", async (t) => {
  createSession(async (session) => {
    const browser = await session.spawnBrowser("canary", {
      executablePath: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    });
    console.log(browser.remoteDebuggingPort);
    const apiClient = session.createAPIClient("localhost", browser.remoteDebuggingPort);
    const tab = await apiClient.newTab("about:blank");
    t.assert(tab.webSocketDebuggerUrl, "has web socket url");
    const debuggingClient = await session.openDebuggingProtocol(tab.webSocketDebuggerUrl!);
    const heapProfiler = new HeapProfiler(debuggingClient);
    let buffer = "";
    await heapProfiler.enable();
    heapProfiler.addHeapSnapshotChunk = (params) => {
        buffer += params.chunk;
    };
    console.log(heapProfiler);
    heapProfiler.reportHeapSnapshotProgress = (params) => {
        t.comment(params.done / params.total + "");
    };
    await heapProfiler.takeHeapSnapshot({ reportProgress: false });
    await heapProfiler.disable();
    t.assert(buffer.length > 0, "received chunks");
    const data = JSON.parse(buffer);
    t.assert(data.snapshot.meta, "has snapshot");
  }).then(() => t.end(), (err) => err ? t.error(err) : t.fail());
});


tape("test debugging profiler for coverage", async (t) => {
  createSession(async (session) => {
    const browser = await session.spawnBrowser("canary", {
      executablePath: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    });
    const apiClient = session.createAPIClient("localhost", browser.remoteDebuggingPort);
    const tab = await apiClient.newTab("about:blank");
    t.assert(tab.webSocketDebuggerUrl, "has web socket url");
    const debuggingClient = await session.openDebuggingProtocol(tab.webSocketDebuggerUrl!);
    const profiler = new Profiler(debuggingClient);
    console.log(profiler);
    await profiler.enable();
    const g = await profiler.startPreciseCoverage({
        callCount: true
    });
    console.log(g);
    console.log(profiler);


  }).then(() => t.end(), (err) => err ? t.error(err) : t.fail());
});
