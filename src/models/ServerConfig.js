const mongoose = require('mongoose');

const serverConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    channels: {
        news: {
            type: String,
            default: null
        },
        train: {
            type: String,
            default: null
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

serverConfigSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ServerConfig', serverConfigSchema);
