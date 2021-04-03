const {Pool} = require("pg");
const {v4: uuidv4} = require("uuid");
require("dotenv-safe").config();
const jwt = require('jsonwebtoken');


const poolConfig = {
      user: 'postgres',
      password: 'postgres',
      port: '5432',
      host: 'localhost',
      database: 'project'
}
const pool = new Pool(poolConfig)
pool.on('error', (error) => {
            console.log(`Pool error: ${error}`);
      })

function verifyJWT(req,res){
      const token = req.body['authToken'];
      if(!token){
            return -1;
      }
      var value = -2;
      jwt.verify(token,process.env.SECRET, function(err, decoded){
            if(err){
                  value = -2;
            }
            
            value = decoded.userid;
      });
      return value;
}

const getLeiloes = async (req,res)=>{
      //Ver autenticação se está logged in
      //Buscar todos os Leiloes ativos com o pg
      try{
            
            
            req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  const response = await pool.query('SELECT * FROM leilao;')
                  res.send(response.rows);
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }
            
            
            
      }catch(err){
            console.log("Empty");
      }
      console.log("Leiloes");
};

const createUser = async (req,res)=>{
      var max;
      try {
            max = await pool.query('SELECT max(userid) FROM utilizador;');
            if(max.rows){
                  max = BigInt(max.rows[0].max);
            }else{
                  max = BigInt(0);
            }
      } catch (error) {
            console.log(error);
            max = BigInt(0);
      }
      max = max +1n;
      const {username,email,password,admin} =  req.body;
      var adminBool;
      if(admin == "true"){
            adminBool = true;
      }else{
            adminBool = false;
      }
      try {
            const response = await pool.query('INSERT INTO utilizador (userid,username,email,password,admin,blocked) VALUES ($1,$2,$3,$4,$5,$6);',[max,username,email,password,adminBool,false]);
            console.log(response);
      } catch (error) {
            console.log(error)     
      }
      res.send("User created");
      
};

const Login = async (req,res)=>{
      const {username,password} = req.body;
      try {
            const response = await pool.query('SELECT userid FROM utilizador WHERE username=$1 AND password=$2',[username,password]);
            if(response.rows){
                  const userid = response.rows[0].userid;
                  const token = jwt.sign( { userid }, process.env.SECRET,{
                        expiresIn:500
                  } );
                  res.json({auth: true,authToken: token});
            }else{
                  res.json({erro: "AuthError"})
            }

      } catch (error) {
            console.log(error);  
      }

      
      console.log("Logged In");
      
}

const criarLeilao = async (req, res) => {
      var max;
      
      try {
            const {titulo,descricao,artigoid,minpreco,datacomeco,datafim} = req.body;
            req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  try {
                        
                  
                        max = await pool.query('SELECT max(leilaoid) FROM leilao;');
                        
                        if(max.rows){
                              max = BigInt(max.rows[0].max)+BigInt(1);
                        }else{
                              max = BigInt(0);
                        }
                  } catch (error) {
                        max = BigInt(0);     
                  }
                  try {
                        
                        const success = await pool.query('INSERT INTO leilao (leilaoid,titulo,descricao,artigoid,minpreco,datacomeco,datafim,utilizador_userid,cancelar) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,DEFAULT);',[max,titulo,descricao,artigoid,minpreco,datacomeco,datafim,req.userid]);
                        console.log(success);
                  } catch (error) {
                        return res.json({erro:error});
                        
                  }
                  res.json({leilaoId:max});
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }
            
      } catch (error) {
            console.log(error);
            return res.json({erro:error});
            
      }
      
      
}


const getLeilaoByID = async (req, res)=>{
      //Meter a verificação que fez login
      const number = BigInt(req.params.leilaoId);
      const response = await pool.query('SELECT * FROM leilao WHERE leilaoid = $1',[number]);
      res.json(response);
}






const getLeiloesByKeyword = async (req,res) =>{
      //Meter a verificação que fez login
      req.params.keyword = req.params.keyword.split("&").join(" ");
      var number = parseInt(req.params.keyword);
      if(isNaN(number)){
            number = -1;
      }
      number = BigInt(number)
      const response = await pool.query('SELECT leilaoid, descricao FROM leilao WHERE descricao=$1 OR artigoid=$2',[req.params.keyword,number])
      return res.json(response.rows);
}

const updateLeilao = async (req,res) =>{
      return res.send(req.params);
}

const getStatistic = async (req, res)=>{

      req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  const user = await pool.query('SELECT admin FROM utilizador WHERE userid=$1',[req.userid]);
                  if(user.rows[0].admin){
                        
                  }
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }

}


module.exports ={
      createUser,
      getLeiloes,
      Login,
      criarLeilao,
      getLeiloesByKeyword,
      updateLeilao,
      getLeilaoByID
}