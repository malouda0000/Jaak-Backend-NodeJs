module.exports = {

    //handling all mongoose errors because it is frequently used with all models thats why it is common
    mongoErrorHandler(err) {
        for (let field in err.errors) {
            return err.errors[field].message;
        }
        
    }
}
