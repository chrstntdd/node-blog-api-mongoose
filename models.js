const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({
  title : { type: String, required: true },
  content: { type: String, required: true },
  author: {
    firstName: { type: String },
    lastName: { type: String }
  },
  created: { type: Date } 
});

blogPostSchema.virtual('fullNameString').get(function(){
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.apiRepresentation = function(){
  return {
    id: this._id,
    title: this.title,
    author: this.fullNameString,
    content: this.content,
    created: this.created
  };
}

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = {BlogPost};