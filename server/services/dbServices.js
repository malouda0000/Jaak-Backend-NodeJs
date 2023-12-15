module.exports = {

    async updateWithId(model, id, update, populate, select) {
        return await model.findByIdAndUpdate(id, update, { new: true }).populate(populate).select(select).exec()
    }

}