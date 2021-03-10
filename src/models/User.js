const Role = {
      //Para caso de haver diferentes roles
      Admin = 1,
      Basic = 0,
};

class User {
      constructor(nome,email,password){
            this.nome = nome;
            this.email = email;
            this.password = password;
      }

      comparePassword(password){
            return  this.password == password;
      }

}

module.exports = {
      Role,
      User
};