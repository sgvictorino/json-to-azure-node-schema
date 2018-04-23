"use strict";

import * as _ from "lodash";

import {
    Type,
    EnumType,
    UnionType,
    ClassType,
    
} from "quicktype/dist/Type";
import {nullableFromUnion,
    matchTypeExhaustive,
    directlyReachableSingleNamedType} from "quicktype/dist/TypeUtils"
import { TypeGraph } from "quicktype/dist/TypeGraph";

import { Sourcelike } from "quicktype/dist/Source";
import {
    legalizeCharacters,
    splitIntoWords,
    combineWords,
    firstUpperWordStyle,
    allUpperWordStyle,
    allLowerWordStyle
} from "quicktype/dist/Strings";
import { intercalate, panic } from "quicktype/dist/Support";

import { Namer, Name } from "quicktype/dist/Naming";

import { ConvenienceRenderer } from "quicktype/dist/ConvenienceRenderer";

import { TargetLanguage } from "quicktype/dist/TargetLanguage";
import { BooleanOption } from "quicktype/dist/RendererOptions";
import { StringTypeMapping } from "quicktype/dist/TypeBuilder";
import {Option} from "quicktype/dist/RendererOptions";
const unicode = require("unicode-properties");

export class AzureDBStaticSchemaTargetLanguage extends TargetLanguage {
    private readonly _declareUnionsOption = new BooleanOption("declare-unions", "Declare unions as named types", false);

    constructor() {
        super("AzureDB", ["azuredb"], "json");
    }
    protected getOptions(): Option<any>[] {
        return [];
}
    protected get partialStringTypeMapping(): Partial<StringTypeMapping> {
        return { date: "date", time: "time", dateTime: "date-time" };
    }

    get supportsOptionalClassProperties(): boolean {
        return true;
    }
 /*   The return type of `rendererClass` doesn’t have the `targetLanguage` argument.
Sorry if I expressed that incorrectly.
(That shouldn’t be the problem, though)
`targetLanguage` is not an argument *to* `rendererClass`.
`rendererClass` returns a constructor, which takes a `targetLanguage` argument.
Anyway, I’ll try to reproduce your error.
*/

    protected get rendererClass(): new (
        targetLanguage: TargetLanguage,
        graph: TypeGraph,
        leadingComments: string[] | undefined,
        ...optionValues: any[]
    ) => ConvenienceRenderer {
        return AzureDBStaticSchemaRenderer;
    }
}

function isStartCharacter(utf16Unit: number): boolean {
    return unicode.isAlphabetic(utf16Unit) || utf16Unit === 0x5f; // underscore
}

function isPartCharacter(utf16Unit: number): boolean {
    const category: string = unicode.getCategory(utf16Unit);
    return _.includes(["Nd", "Pc", "Mn", "Mc"], category) || isStartCharacter(utf16Unit);
}

const legalizeName = legalizeCharacters(isPartCharacter);

function simpleNameStyle(original: string, uppercase: boolean): string {
    const words = splitIntoWords(original);
    return combineWords(
        words,
        legalizeName,
        uppercase ? firstUpperWordStyle : allLowerWordStyle,
        firstUpperWordStyle,
        uppercase ? allUpperWordStyle : allLowerWordStyle,
        allUpperWordStyle,
        "",
        isStartCharacter
    );
}

class AzureDBStaticSchemaRenderer extends ConvenienceRenderer {
    constructor(targetLanguage: TargetLanguage, graph: TypeGraph, leadingComments: string[] | undefined, private readonly inlineUnions: boolean) {
        super(targetLanguage, graph, leadingComments);
    }

    protected topLevelNameStyle(rawName: string): string {
        return simpleNameStyle(rawName, true);
    }

    protected makeNamedTypeNamer(): Namer {
        return new Namer("types", n => simpleNameStyle(n, true), []);
    }

    protected namerForObjectProperty(): Namer {
        return new Namer("properties", n => simpleNameStyle(n, false), []);
    }

    protected makeUnionMemberNamer(): null {
        return null;
    }

    protected makeEnumCaseNamer(): Namer {
        return new Namer("enum-cases", n => simpleNameStyle(n, true), []);
    }

    protected namedTypeToNameForTopLevel(type: Type): Type | undefined {
        return directlyReachableSingleNamedType(type);
    }

    sourceFor = (t: Type): Sourcelike => {
        return matchTypeExhaustive<Sourcelike>(
            t,
            _noneType => {
                return panic("None type should have been replaced");
            },
            _anyType => "any",
            _nullType => "null",
            _boolType => "boolean",
            _integerType => "number",
            _doubleType => "number",
            _stringType => "string",
            arrayType => ["List<", this.sourceFor(arrayType.items), ">"],
            classType => this.nameForNamedType(classType),
            mapType => ["Map<String, ", this.sourceFor(mapType.values), ">"],
            enumType => this.nameForNamedType(enumType),
            unionType => {
                const nullable = nullableFromUnion(unionType);
                if (nullable !== null) return ["Maybe<", this.sourceFor(nullable), ">"];

                if (this.inlineUnions) {
                    const children = unionType.children.map((c: Type) => this.sourceFor(c));
                    return intercalate(" | ", children).toArray();
                } else {
                    return this.nameForNamedType(unionType);
                }
            },
            _dateType => "Date",
            _timeType => "Time",
            _dateTimeType => "DateTime"
        );
    };

    private emitClass = (c: ClassType, className: Name) => {
         let count = c.properties.count();
        this.emitLine("{");
        this.indent(() => {
            this.forEachClassProperty(c, "none", (name, _jsonName, p) => {
                 const last = --count === 0;
                if(!last){
                this.emitLine("\"",name,"\"", p.isOptional ? "?" : "", ": \"", this.sourceFor(p.type) + "\",");
                }else{
                this.emitLine("\"",name,"\"", p.isOptional ? "?" : "", ": \"", this.sourceFor(p.type) + "\"");
                }
            });
        });
        this.emitLine("}");
    };

    emitEnum = (e: EnumType, enumName: Name) => {
        const caseNames: Sourcelike[] = [];
        this.forEachEnumCase(e, "none", name => {
            if (caseNames.length > 0) caseNames.push(" | ");
            caseNames.push(name);
        });
        this.emitLine("enum ", enumName, " = ", caseNames);
    };

    emitUnion = (u: UnionType, unionName: Name) => {
        this.emitLine("union ", unionName, " {");
        this.indent(() => {
            this.forEach(u.members, false, false, (t: Type) => {
                this.emitLine("case ", this.sourceFor(t));
            });
        });
        this.emitLine("}");
    };

    protected emitSourceStructure() {
        if (this.leadingComments !== undefined) {
            this.emitCommentLines("// ", this.leadingComments);
        }
        this.forEachClass("leading-and-interposing", this.emitClass);
        this.forEachEnum("leading-and-interposing", this.emitEnum);
        if (!this.inlineUnions) {
            this.forEachUnion("leading-and-interposing", this.emitUnion);
        }
    }
}
