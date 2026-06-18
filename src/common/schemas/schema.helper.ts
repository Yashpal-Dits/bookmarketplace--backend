import {Schema} from 'mongoose';


export function applyVirtualId(schema : Schema) : void {
    schema.virtual ('id').get(function () {
        return (this._id as any).toHexString();
    });

 schema.set('toJSON', {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
        delete ret._id;
        delete ret._v;
        return ret;
    },
 });
}