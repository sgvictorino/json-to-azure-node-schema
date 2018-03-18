"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var Type_1 = require("quicktype/dist/Type");
var Strings_1 = require("quicktype/dist/Strings");
var Support_1 = require("quicktype/dist/Support");
var Naming_1 = require("quicktype/dist/Naming");
var ConvenienceRenderer_1 = require("quicktype/dist/ConvenienceRenderer");
var TargetLanguage_1 = require("quicktype/dist/TargetLanguage");
var RendererOptions_1 = require("quicktype/dist/RendererOptions");
var unicode = require("unicode-properties");
var AzureDBStaticSchemaTargetLanguage = /** @class */ (function (_super) {
    __extends(AzureDBStaticSchemaTargetLanguage, _super);
    function AzureDBStaticSchemaTargetLanguage() {
        var _this = _super.call(this, "AzureDB", ["azuredb"], "json") || this;
        _this._declareUnionsOption = new RendererOptions_1.BooleanOption("declare-unions", "Declare unions as named types", false);
        return _this;
    }
    AzureDBStaticSchemaTargetLanguage.prototype.getOptions = function () {
        return [];
    };
    Object.defineProperty(AzureDBStaticSchemaTargetLanguage.prototype, "partialStringTypeMapping", {
        get: function () {
            return { date: "date", time: "time", dateTime: "date-time" };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AzureDBStaticSchemaTargetLanguage.prototype, "supportsOptionalClassProperties", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AzureDBStaticSchemaTargetLanguage.prototype, "rendererClass", {
        get: function () {
            return AzureDBStaticSchemaRenderer;
        },
        enumerable: true,
        configurable: true
    });
    return AzureDBStaticSchemaTargetLanguage;
}(TargetLanguage_1.TargetLanguage));
exports.default = AzureDBStaticSchemaTargetLanguage;
function isStartCharacter(utf16Unit) {
    return unicode.isAlphabetic(utf16Unit) || utf16Unit === 0x5f; // underscore
}
function isPartCharacter(utf16Unit) {
    var category = unicode.getCategory(utf16Unit);
    return _.includes(["Nd", "Pc", "Mn", "Mc"], category) || isStartCharacter(utf16Unit);
}
var legalizeName = Strings_1.legalizeCharacters(isPartCharacter);
function simpleNameStyle(original, uppercase) {
    var words = Strings_1.splitIntoWords(original);
    return Strings_1.combineWords(words, legalizeName, uppercase ? Strings_1.firstUpperWordStyle : Strings_1.allLowerWordStyle, Strings_1.firstUpperWordStyle, uppercase ? Strings_1.allUpperWordStyle : Strings_1.allLowerWordStyle, Strings_1.allUpperWordStyle, "", isStartCharacter);
}
var AzureDBStaticSchemaRenderer = /** @class */ (function (_super) {
    __extends(AzureDBStaticSchemaRenderer, _super);
    function AzureDBStaticSchemaRenderer(graph, leadingComments, inlineUnions) {
        var _this = _super.call(this, graph, leadingComments) || this;
        _this.inlineUnions = inlineUnions;
        _this.sourceFor = function (t) {
            return Type_1.matchTypeExhaustive(t, function (_noneType) {
                return Support_1.panic("None type should have been replaced");
            }, function (_anyType) { return "any"; }, function (_nullType) { return "null"; }, function (_boolType) { return "boolean"; }, function (_integerType) { return "number"; }, function (_doubleType) { return "number"; }, function (_stringType) { return "string"; }, function (arrayType) { return ["List<", _this.sourceFor(arrayType.items), ">"]; }, function (classType) { return _this.nameForNamedType(classType); }, function (mapType) { return ["Map<String, ", _this.sourceFor(mapType.values), ">"]; }, function (enumType) { return _this.nameForNamedType(enumType); }, function (unionType) {
                var nullable = Type_1.nullableFromUnion(unionType);
                if (nullable !== null)
                    return ["Maybe<", _this.sourceFor(nullable), ">"];
                if (_this.inlineUnions) {
                    var children = unionType.children.map(function (c) { return _this.sourceFor(c); });
                    return Support_1.intercalate(" | ", children).toArray();
                }
                else {
                    return _this.nameForNamedType(unionType);
                }
            }, function (_dateType) { return "Date"; }, function (_timeType) { return "Time"; }, function (_dateTimeType) { return "DateTime"; });
        };
        _this.emitClass = function (c, className) {
            _this.emitLine("{");
            _this.indent(function () {
                _this.forEachClassProperty(c, "none", function (name, _jsonName, p) {
                    _this.emitLine("\"", name, "\"", p.isOptional ? "?" : "", ": \"", _this.sourceFor(p.type) + "\",");
                });
            });
            _this.emitLine("}");
        };
        _this.emitEnum = function (e, enumName) {
            var caseNames = [];
            _this.forEachEnumCase(e, "none", function (name) {
                if (caseNames.length > 0)
                    caseNames.push(" | ");
                caseNames.push(name);
            });
            _this.emitLine("enum ", enumName, " = ", caseNames);
        };
        _this.emitUnion = function (u, unionName) {
            _this.emitLine("union ", unionName, " {");
            _this.indent(function () {
                _this.forEach(u.members, false, false, function (t) {
                    _this.emitLine("case ", _this.sourceFor(t));
                });
            });
            _this.emitLine("}");
        };
        return _this;
    }
    AzureDBStaticSchemaRenderer.prototype.topLevelNameStyle = function (rawName) {
        return simpleNameStyle(rawName, true);
    };
    AzureDBStaticSchemaRenderer.prototype.makeNamedTypeNamer = function () {
        return new Naming_1.Namer("types", function (n) { return simpleNameStyle(n, true); }, []);
    };
    AzureDBStaticSchemaRenderer.prototype.namerForClassProperty = function () {
        return new Naming_1.Namer("properties", function (n) { return simpleNameStyle(n, false); }, []);
    };
    AzureDBStaticSchemaRenderer.prototype.makeUnionMemberNamer = function () {
        return null;
    };
    AzureDBStaticSchemaRenderer.prototype.makeEnumCaseNamer = function () {
        return new Naming_1.Namer("enum-cases", function (n) { return simpleNameStyle(n, true); }, []);
    };
    AzureDBStaticSchemaRenderer.prototype.namedTypeToNameForTopLevel = function (type) {
        return Type_1.directlyReachableSingleNamedType(type);
    };
    AzureDBStaticSchemaRenderer.prototype.emitSourceStructure = function () {
        if (this.leadingComments !== undefined) {
            this.emitCommentLines("// ", this.leadingComments);
        }
        this.forEachClass("leading-and-interposing", this.emitClass);
        this.forEachEnum("leading-and-interposing", this.emitEnum);
        if (!this.inlineUnions) {
            this.forEachUnion("leading-and-interposing", this.emitUnion);
        }
    };
    return AzureDBStaticSchemaRenderer;
}(ConvenienceRenderer_1.ConvenienceRenderer));
//# sourceMappingURL=AzureDBStaticSchema.js.map