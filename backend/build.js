const { build } = require("esbuild");
const { Generator } = require("npm-dts");
const { devDependencies } = require("../package.json");

const args = process.argv.slice(2);
const isStandalone = args[0] === "standalone";

if(isStandalone){
    console.log();
    console.log("*************");
    console.log("Compiling server as standalone");
    console.log("npm run build", "to build indiviual gameserver and webserver");
    console.log("*************");
    console.log();
}else{
    console.log();
    console.log("*************");
    console.log("Compiling indivually");
    console.log("npm run build-standalone", "to build a standalone server");
    console.log("*************");
    console.log();
}

const inputDir = __dirname + "/src/";
const outputDir = __dirname + "/build/";
const entryFileName = isStandalone ? "Standalone.js" : "index.ts";


//BEGIN SERVER BUILD
{
    let makeAllPackagesExternalPlugin = {
        name: "make-all-packages-external",
        setup(build) {
            let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/; // Must not start with "/" or "./" or "../"
            build.onResolve({ filter }, (args) => ({
                path: args.path,
                external: true,
            }));
        },
    };

    const entryFile = inputDir + entryFileName;
    const shared = {
        entryPoints: [entryFile],
        bundle: true,
        platform: "node",
        target: "node10.4",
        external: Object.keys(devDependencies),
        plugins: [makeAllPackagesExternalPlugin],
    };

    build({
        ...shared,
        outfile: outputDir + "index.js",
    });

    build({
        ...shared,
        outfile: outputDir + "index.esm.js",
        format: "esm",
    });

    new Generator({
        entry: entryFile,
        output: outputDir + "index.d.ts",
    }).generate();
}

//END SERVER BUILDER
