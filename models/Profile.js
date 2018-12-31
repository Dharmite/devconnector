// Ligação com a mongodb
const mongoose = require("mongoose");

// Função para criar esquema
const Schema = mongoose.Schema;

// Esquema do Profile --> definição da tabela se fosse mysql

const ProfileSchema = new Schema({
  // Ligação com a tabela users
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },

  // genero de username
  handle: {
    type: String,
    required: true,
    max: 40 // numero de caracteres
  },

  company: {
    type: String
  },

  website: {
    type: String
  },

  location: {
    type: String
  },

  // Se é junior developer, senior developer, etc...
  status: {
    type: String
  },

  // comma separated value, utilizador mete valores tipo: html, css, js
  // sera uma lista de strings, provavelmente temos que fazer split dos valores
  skills: {
    type: [String],
    required: true
  },

  bio: {
    type: String
  },

  // atraves do username vamos buscar os repos, com a api do github
  githubusername: {
    type: String
  },

  // cada objeto representa uma experiencia de trabalho
  experience: [
    {
      title: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: true
      },
      location: {
        type: String
      },
      // Altura em que trabalhou nessa empresa
      from: {
        type: Date,
        required: true
      },

      to: {
        type: Date
      },

      current: {
        type: Boolean,
        default: false
      },

      description: {
        type: String
      }
    }
  ],

  education: [
    {
      school: {
        type: String,
        required: true
      },
      degree: {
        type: String,
        required: true
      },
      fieldofstudy: {
        type: String,
        required: true
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date
      },
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String
      }
    }
  ],
  social: {
    youtube: {
      type: String
    },
    twitter: {
      type: String
    },
    facebook: {
      type: String
    },
    linkedin: {
      type: String
    },
    instagram: {
      type: String
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Profile = mongoose.model("profile", ProfileSchema);
