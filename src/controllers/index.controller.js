const {Pool} = require("pg");




const getLeiloes = async (req,res)=>{
      //Ver autenticação se está logged in
      //Buscar todos os Leiloes ativos com o pg
      res.send("Leiloes");
};

const createUser = async (req,res)=>{
      console.log(req.body);
      res.send("User created");
      
};

const Login = async (req,res)=>{
      console.log("New User");
      res.send("Logged In");
}

const criarLeilao = async (req, res) => {
      res.send("Leilao criado");
}

const getLeiloesByKeyword = async (req,res) =>{
      res.send(req.params.keyword);
}

const updateLeilao = async (req,res) =>{
      res.send(req.params);
}

module.exports ={
      createUser,
      getLeiloes,
      Login,
      criarLeilao,
      getLeiloesByKeyword,
      updateLeilao
}