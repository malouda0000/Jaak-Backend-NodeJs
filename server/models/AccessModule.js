import mongoose, { Schema } from 'mongoose'
import Constant from '../constant'

let AccessModuleModel = new Schema(
    {
        accessName: { type: String, default: null },
        access: [{
            module: { type: String, default: null },
            moduleCode: { type: Number, default: 0 },
            read: { type: Boolean, default: false },
            write: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            filter: { type: Boolean, default: false },
            sort: { type: Boolean, default: false },
            setStatus: { type: Boolean, default: false },
        }],
        status: { type: Number, default: 1 }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
)
let AccessModule = mongoose.model('AccessModule', AccessModuleModel)

export default AccessModule
