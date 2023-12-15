import mongoose, { Schema } from 'mongoose'


const eventSchema = new Schema({

    madeBy : {
        type : Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },

    eventType : {
        type:String,
        enum:['INSTANT','RECURING','SCHEDULE']
    },

    eventDate : {
        type : Date
    },

    startTime : {
        type : Date
    },

    endTime : {
        type : Date
    },

    eventName : {
        type:String
    },

    personsAttendingCount : {
        type : Number
    },

    location : {
        type: [Number]
    },

    budget : { 
        type : Number
    },

    menuDescription : {
        type : String
    },

    notes : {
        type : [String]
    },

    isAdminApproved : { 
        type : Boolean ,
        default : false
    },

    assignedSubAdmin : { 
        type : Schema.Types.ObjectId , 
        ref : 'subadmins'
    },

    isDeleted : {
        type : Boolean,
        default : false
    },

},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})


const Event = mongoose.model('Event', eventSchema)

export default Event