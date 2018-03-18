import { TypeGraph } from "quicktype/dist/TypeGraph";
import { ConvenienceRenderer } from "quicktype/dist/ConvenienceRenderer";
import { TargetLanguage } from "quicktype/dist/TargetLanguage";
import { StringTypeMapping } from "quicktype/dist/TypeBuilder";
import { Option } from "quicktype/dist/RendererOptions";
export default class AzureDBStaticSchemaTargetLanguage extends TargetLanguage {
    private readonly _declareUnionsOption;
    constructor();
    protected getOptions(): Option<any>[];
    protected readonly partialStringTypeMapping: Partial<StringTypeMapping>;
    readonly supportsOptionalClassProperties: boolean;
    protected readonly rendererClass: new (graph: TypeGraph, leadingComments: string[] | undefined, ...optionValues: any[]) => ConvenienceRenderer;
}
