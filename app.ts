#!/usr/bin/env ts-node

import * as fs from "fs";

import { Run, Options } from "quicktype";
import { JavaTargetLanguage, JavaRenderer } from "quicktype/dist/Language/Java"
import { TypeGraph } from "quicktype/dist/TypeGraph";
import { ConvenienceRenderer } from "quicktype/dist/ConvenienceRenderer";
import { ClassType, ClassProperty, Type } from "quicktype/dist/Type";
import { Name, FixedName } from "quicktype/dist/Naming";
import { capitalize } from "quicktype/dist/Strings";
import { AzureDBStaticSchemaTargetLanguage } from "./AzureDBStaticSchema";
var testinput = {
    t:"e"
    };
async function main() {
    const schema = testinput;
    const lang = new AzureDBStaticSchemaTargetLanguage();
    const options: Partial<Options> = {
        lang,
sources: [ { name: "TopLevel", schema }] };
    const run = new Run(options);
    const files = await run.run();
    files.forEach((srr, filename) => {
        console.log(`// ${filename}`);
        console.log("//");
        for (var line of srr.lines) {
            console.log(line);
        }
    });
}

main();
