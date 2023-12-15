const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SetReminderModel = new Schema({
    pushNotification: {
        type: Boolean,
        default: false
    },
    pushNotificationInterval: { 
        type: Number,
        default: 1
    },
    callNotification: {
        type: Boolean,
        default: false
    },
    callNotificationInterval: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
});

const SetReminder = mongoose.model('SetReminder', SetReminderModel);
module.exports = SetReminder;
