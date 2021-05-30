const {Pool} = require("pg");
const {v4: uuidv4} = require("uuid");
require("dotenv-safe").config();
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { notify } = require("../routes");




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


function scheduleNotif(leilaoid, criador,comeco,datafim) {
      comeco = comeco.replace(" ","T");
      let com = new Date(Date.parse(comeco));
      com.setHours(com.getHours());
      datafim = datafim.replace(" ","T");
      let fim = new Date(Date.parse(datafim));
      fim.setHours(fim.getHours());
      
      console.log(com)
      
      var j =schedule.scheduleJob( com,async () => {
            console.log("Começou");
            notifyPerson(criador,"Leilão "+leilaoid.toString() +" Começou", new Date());
      });
      console.log(fim);

      schedule.scheduleJob(fim,async () =>{
            console.log("Acabou");
            notifyPerson(criador,"Leilão "+leilaoid.toString() +" Acabou", new Date());
            const winner = await pool.query('SELECT licitacao.utilizador_userid FROM licitacao,leilao WHERE leilaoid = $1 AND licitacao.leilao_leilaoid = leilao.leilaoid AND licitacao.precodelicitacao = (Select MAX(precodelicitacao) FROM licitacao,leilao WHERE licitacao.leilao_leilaoid = leilao.leilaoid)',[leilaoid]);
            notifyPerson(winner.rows[0].utilizador_userid,`Leilao ${leilaoid} Ganhaste`, new Date());
            
      
      });
      
      
}


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
            try {
                  value = decoded.userid;
            } catch (error) {
                  res.json({erro:"ReLogin"});
            }
            
      });
      return value;
}


const getLeiloes = async (req,res)=>{
      //Ver autenticação se está logged in
      //Buscar todos os Leiloes ativos com o pg

      //Buscar a nova
      try{
            
            req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  const response = await pool.query('SELECT leilao.leilaoid, descricao_titulo.titulo, descricao_titulo.descricao, leilao.artigoid, leilao.datacomeco, leilao.datafim, leilao.utilizador_userid  FROM leilao,descricao_titulo WHERE descricao_titulo.leilao_leilaoid = leilao.leilaoid GROUP BY descricao_titulo.leilao_leilaoid,leilao.leilaoid HAVING MAX(datademudanca)=datademudanca;')
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
      bcrypt.hash(password,saltRounds,async (err, hash)=> {
            try {
                  const response = await pool.query('INSERT INTO utilizador (userid,username,email,password,admin,blocked) VALUES ($1,$2,$3,$4,$5,$6);',[max,username,email,hash,adminBool,false]);
                  console.log(response);
            } catch (err1) {
                  return res.json({erro: err1});  
            }    
      })
      
      res.send("User created");
      
};

const Login = async (req,res)=>{
      const {username,password} = req.body;
      try {
            const response = await pool.query('SELECT userid,password FROM utilizador WHERE username=$1 AND  blocked=$2',[username,false]);
            if(response.rows){
                  const userid = response.rows[0].userid;
                  const passwordAfter = response.rows[0].password;
                  const match = await bcrypt.compare(password,passwordAfter);

                  if(match){
                  const token = jwt.sign( { userid }, process.env.SECRET,{
                        expiresIn:1000000000
                  } );
                        return res.json({auth: true,authToken: token});
                  }else{
                        return res.json({auth: false,erro: "Wrong Password"});
                  }
            }else{
                  return res.json({erro: "AuthError"})
            }

      } catch (error) {
            return res.json({erro:error});  
      }

      
      
}

const criarLeilao = async (req, res) => {
      //Por titulo
      var max,max2;
      
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
                        
                  
                        max2 = await pool.query('SELECT max(descricao_titulo_id) FROM descricao_titulo;');
                        
                        if(max2.rows){
                              max2 = BigInt(max2.rows[0].max)+BigInt(1);
                        }else{
                              max2 = BigInt(0);
                        }
                  } catch (error) {
                        max2 = BigInt(0);     
                  }
                  try {
                        const timeStamp = new Date();
                        await pool.query('Begin Transaction;');
                        await pool.query('INSERT INTO leilao (leilaoid,artigoid,minpreco,datacomeco,datafim,utilizador_userid,cancelar) VALUES ($1,$2,$3,$4,$5,$6,DEFAULT);',[max,artigoid,minpreco,datacomeco,datafim,req.userid]);
                        await pool.query('INSERT INTO  descricao_titulo (descricao,titulo,datademudanca,leilao_leilaoid,descricao_titulo_id) VALUES ($1,$2,$3,$4,$5);',[descricao,titulo,timeStamp,max,max2]);
                        await pool.query('Commit;');
                        scheduleNotif(max,req.userid,datacomeco,datafim);
                        return res.json({leilaoId:parseInt(max)});
                  } catch (error) {
                        console.log(error);
                        return res.json({erro:error});
                        
                  }
                  
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

const makeLicitation = async (req, res) =>{
      try{
            const leilaoid = BigInt(req.params.leilaoId);
            const licitacao = Number(req.params.licitacao);
            req.userid = verifyJWT(req,res);
            const date = new Date();
            var max;
            try {
                        
                  
                  max = await pool.query('SELECT max(licitacao_id) FROM licitacao;');
                  
                  if(max.rows){
                        max = BigInt(max.rows[0].max)+BigInt(1);
                  }else{
                        
                        max = BigInt(0);
                  }
            } catch (error) {
                  
                  max = BigInt(0);     
            }
            
            if(req.userid>=0){
                  
                  await pool.query("Begin Transaction;");
                  const success = await pool.query('Select leilaoid,minpreco,datacomeco,datafim FROM leilao WHERE leilaoid = $1',[leilaoid]);
                  const value = await pool.query("SELECT MAX(licitacao.precodelicitacao) FROM leilao, licitacao WHERE leilao.leilaoid = $1 AND leilao.leilaoid = licitacao.leilao_leilaoid AND licitacao.anulada = false ",[leilaoid]);
                  
                        if(success.rows[0].datacomeco < date || date > success.rows[0].datafim){
                              console.log(success.rows[0].minpreco && value.rows[0].precodelicitacao < licitacao);
                              
                              
                              if(success.rows[0].minpreco < licitacao ){
                                    console.log("Here");
                                    await pool.query('INSERT INTO licitacao (datadalicitacao, precodelicitacao,utilizador_userid,leilao_leilaoid,licitacao_id,anulada) VALUES ($1,$2,$3,$4,$5,DEFAULT);',[date,licitacao,req.userid,leilaoid,max]);
                                    await pool.query('Commit;');
                                    
                                    
                                    // Mandar mensagem a todos os users que foram ultrapassados
                                    const allusers = await pool.query('Select DISTINCT licitacao.utilizador_userid FROM  leilao,licitacao WHERE leilaoid = licitacao.leilao_leilaoid AND precodelicitacao < $1 ',[licitacao]);
                                    for(const u of  allusers.rows ){
                                          notifyPerson(u.utilizador_userid,`No Leilão ${leilaoid} foste ultrapassado`,new Date());
                                    }
                                    return res.json({success:"Licitação aconteceu"});
                              }else{
                                    await pool.query('Rollback;');
                                    return res.json({erro:"A licitação tem de ser maior"});
                              }
                        }else{
                              await pool.query('Rollback;');
                              return res.json({erro:"Fora da altura"});
                        }
                  
                  
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'});
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'});
            }
      }catch(err){
            console.log(err)
            await pool.query('Rollback;');
            return res.json({erro:err});
      }
      return res.json({erro:"Not valid user. Login Again"});

}

const getLeilaoByID = async (req, res)=>{
      //Meter a verificação que fez login
      const number = BigInt(req.params.leilaoId);
      const response = await pool.query('SELECT descricao_titulo.leilao_leilaoid, descricao_titulo.titulo,artigoid, descricao_titulo.descricao, leilao.datacomeco, leilao.datafim, leilao.utilizador_userid  FROM leilao,descricao_titulo WHERE descricao_titulo.leilao_leilaoid = leilao.leilaoid AND leilaoid = $1 AND datademudanca = (SELECT MAX(datademudanca) FROM descricao_titulo)',[number]);
      res.json(response.rows);
}


const insertMural = async (req, res) =>{
      try{
            const leilaoid = BigInt(req.params.leilaoId);
            const texto = String(req.body.texto);
            req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  
                  try {
                        const date = new Date();
                        //await pool.query('Begin Transaction;'); // pretty sure this isnt needed here
                        await pool.query('INSERT INTO mural (texto,datetime,leilao_leilao_id,utilizador_userid) VALUES ($1,$2,$3,$4);',[texto, date, leilaoid,req.userid]);
                        //await pool.query('Commit;') // pretty sure this isnt needed here
                        const message= "Nova mensagem no mural da eleicao "+ leilaoid;
                        const people = await pool.query('SELECT DISTINCT utilizador_userid FROM mural WHERE leilao_leilaoid = $1 AND utilizador_userid != $2',[leilaoid,req.userid]);
                        for(const element of people.rows){
                              notifyPerson(element.utilizador_userid, message,date);     
                        }
                        return res.json({success:message});
                  } catch (error) {
                        console.log(error);
                        return res.json({erro:error});
                        
                  }
                  
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

/* notifica o userid de uma nova mensagem no mural */
const notifyPerson=async (userid,message,date)=>{
      var max;
      await pool.query("Begin Transaction;");
      
      try { 
            await pool.query("LOCK TABLE mensagem IN ROW EXCLUSIVE MODE;")
            max = await pool.query('SELECT max(mensagem_id) FROM mensagem;');
            
            if(max.rows != null){
                  max = BigInt(max.rows[0].max)+1n;
            }else{
                  max = BigInt(0);
            }
      } catch (error) {
            console.log(error);
            max = BigInt(0);     
      }
      try {
            
            await pool.query('INSERT INTO mensagem (texto,utilread,notifdate,utilizador_userid,mensagem_id) VALUES ($1,$2,$3,$4,$5);',[message, false, date, userid,max]);
            await pool.query("Commit;");

      } catch (error) {
            await pool.query("Rollback;");
            console.log(error);
            // idk how to handle the error
      }
}

const nofifyGroup = async (group,message,date,paramenter)=>{
      var max;
      await pool.query("Begin Transaction;");
      
      try { 
            await pool.query("LOCK TABLE mensagem IN ROW EXCLUSIVE MODE;")
            max = await pool.query('SELECT max(mensagem_id) FROM mensagem;');
            
            if(max.rows != null){
                  max = BigInt(max.rows[0].max)+1n;
            }else{
                  max = BigInt(0);
            }
      } catch (error) {
            console.log(error);
            max = BigInt(0);     
      }
      try {
            for(const u of group.rows){
                  await pool.query('INSERT INTO mensagem (texto,utilread,notifdate,utilizador_userid,mensagem_id) VALUES ($1,$2,$3,$4,$5);',[message, false, date, u[paramenter],max]);
            await pool.query("Commit;");
            }
      } catch (error) {
            
      }
}


const banUser = async (req, res) => {
      try {
            req.userid = verifyJWT(req,res);
            const aux1= await pool.query('SELECT userid FROM utilizador WHERE username=$1',[req.body.userToBan]);
            const userToBan = aux1.rows[0].userid;

            if (req.userid>=0){
                  const user = await pool.query('SELECT admin FROM utilizador WHERE userid=$1',[req.userid]);

                  if (user.rows[0].admin){
                        // se for admin pode banir o user escolhido
                        await pool.query('Begin Transaction;');
                        await pool.query('UPDATE utilizador SET blocked = $1 WHERE userid = $2',[true, userToBan]);
                        await pool.query('Commit;');
                        
                        // todos os leiloes pertencentes ao user banido, notificamos todos os que que licitaram no leilao do seu cancelamento
                        const leiloes = await pool.query('SELECT leilao.leilaoid FROM leilao WHERE utilizador_userid=$1',[userToBan]);
                        for(const l of leiloes.rows){
                              const users = await pool.query('SELECT DISTINCT licitacao.utilizador_userid FROM licitacao WHERE licitacao.leilao_leilaoid=$1',[l.leilaoId]);
                              for( const u of users.rows) {
                                    notifyPerson(u.utilizador_userid, "Leilao " + l.leilaoId + "cancelado, o dono do artigo foi banido.");
                              }
                        }
                        
                        //todas as licitacoes em leiloes pelo user banido, verificamos todos os outros users que licitaram nos mesmos leiloes que o user e invalidamos os valores superiores ao do user
                        const licitacoes = await pool.query('SELECT DISTINCT leilao_leilaoid FROM licitacao WHERE utilizador_userid=$1',[userToBan]);
                        for(const li of licitacoes.rows) {
                              // para cada leilao verificamos o valor licitado pelo user e atualizamos no leilao
                              var new_value;
                              await pool.query('Begin Transaction;');
                              const aux = await pool.query('SELECT licitacao.precodelicitacao FROM licitacao WHERE licitacao.leilao_leilaoid=$1 AND licitacao.utilizador_userid=$2 SORT BY precodelicitacao',[li.leilao_leilaoid, userToBan]);
                              if(li.precodelicitacao< aux[0].precodelicitacao){
                                    new_value= aux.rows[0];
                                    await pool.query('UPDATE leilao SET minpreco = $1 WHERE leilaoid = $2',[new_value.precodelicitacao,li.leilao_leilaoid]);   
                              }
                              else{
                                    new_value= aux.rows[1];
                                    await pool.query('UPDATE licitacao SET anulada = $1 WHERE leilao_leilaoid = $2',[true,li.leilao_leilaoid]); // not sure
                                    await pool.query('UPDATE leilao SET minpreco = $1 WHERE leilaoid = $2',[new_value.precodelicitacao,li.leilao_leilaoid]);
                              }
                              await pool.query('Commit;');
                              console.log("Here");
                              //notificar e alterar
                              const users_li = await pool.query('SELECT * FROM licitacao WHERE licitacao.leilao_leilaoid=$1 ORDER BY precodelicitacao DESC',[li.leilao_leilaoid]);
                              var first= true;
                              for (const u of users_li.rows) {
                                    if(u.utilizador_userid!= userToBan){
                                          if(first){
                                                first=false;
                                                await pool.query('UPDATE licitacao SET precodalicitacao = $1 WHERE (datadalicitacao=$2 AND utilizador_userid=$3 AND leilao_leilaoid=$4)',[new_value.precodelicitacao,u.datadaeleicao, u.utilizador_userid, u.leilao_leilaoid]);
                                                notifyPerson(u.utilizador_userid, "Licitacao alterada no leilao " + li.leilao_leilaoid + ", o utilizador de uma licitacao inferior foi banido. A sua licitacao continua como a maior atualmente mas o seu novo valor é " + new_value.precodelicitacao+ ". Pedimos desculpa pelo incomodo.");
                                          }
                                          else notifyPerson(u.utilizador_userid, "Licitacao invalidadada no leilao " + li.leilao_leilaoid + ", o utilizador de uma licitacao inferior foi banido. A maior licitacao agora é " + new_value.precodelicitacao+ ". Pedimos desculpa pelo incomodo.");
                                    }
                              }
                        }
                        return res.json({user:userToBan, message: 'Banido'});
                        
                  } else {
                        return res.json({auth:false, message: 'You are not admin'});
                  }
            } else if (req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            } else if (req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }
      } catch (err) {
            console.log(err);
            await pool.query('Rollback;');
            return res.json({erro:err});
      }
}

const cancelLeilao = async (req,res) => {
      try {
            const leilaoid = BigInt(req.params.leilaoId);
            req.userid = verifyJWT(req,res);

            if (req.userid>=0) {
                  const user = await pool.query('SELECT admin FROM utilizador WHERE userid=$1',[req.userid]);

                  if (user.rows[0].admin) {
                        // se for admin pode cancelar o leilao escolhido
                        await pool.query('UPDATE leilao SET cancelar = $1 WHERE leilaoid = $2',[true, leilaoid]);
                        //await pool.query('Commit;');

                        const users = await pool.query('SELECT DISTINCT licitacao.utilizador_userid FROM licitacao WHERE licitacao.leilao_leilaoid=$1',[leilaoid]);
                        for(const u of users.rows) {
                              notifyPerson(u.utilizador_userid, "Leilao " + req.params.leilaoId + "cancelado por um admin.",new Date());
                        }

                        return res.json({leilaoId:req.params.leilaoId});
                  } else {
                        return res.json({auth:false, message: 'You are not admin'});
                  }
                  
            } else if (req.userid == -1) {
                  return res.json({auth: false, message: 'No token provided.'});
            } else if (req.userid == -2) {
                  return res.json({auth: false, message: 'Failed to authenticate token.'});
            }
      } catch (err) {
            console.log(err);
            await pool.query('Rollback;');
            return res.json({erro:err});
      }
}




const getLeiloesByKeyword = async (req,res) =>{
      //Meter a verificação que fez login
      req.params.keyword = req.params.keyword.split("&").join(" ");
      var number = parseInt(req.params.keyword);
      if(isNaN(number)){
            number = -1;
      }
      number = BigInt(number)
      const response = await pool.query('SELECT leilao.leilaoid, descricao_titulo.descricao FROM leilao, descricao_titulo WHERE leilao.leilaoid = descricao_titulo.leilao_leilaoid AND (descricao_titulo.descricao=$1 OR artigoid=$2)',[req.params.keyword,number])
      return res.json(response.rows);
}

//acabar
const updateLeilao = async (req,res) =>{
      const timeStamp = new Date();
      var max;
      try {
            try {
                        
                  
                  max = await pool.query('SELECT max(descricao_titulo_id) FROM descricao_titulo;');
                  
                  if(max.rows){
                        max = BigInt(max.rows[0].max)+BigInt(1);
                  }else{
                        max = BigInt(0);
                  }
            } catch (error) {
                  max = BigInt(0);     
            }
            const leilaoid = BigInt(req.params.leilaoId);
            const {titulo,descricao} = req.body;
            req.userid = verifyJWT(req,res);
            if(req.userid>=0){
                  await pool.query("Begin Transaction");
                  const resp =await pool.query('SELECT utilizador_userid FROM leilao WHERE leilao.leilaoid =  $1',[leilaoid]);
                  if(resp.rows[0].utilizador_userid == BigInt(req.userid)){
                        await pool.query('INSERT INTO  descricao_titulo (descricao,titulo,datademudanca,leilao_leilaoid,descricao_titulo_id) VALUES ($1,$2,$3,$4,$5);',[descricao,titulo,timeStamp,leilaoid,max]);
                        await pool.query('Commit;');
                        return res.json({LeilaoId:req.params.leilaoId});
                  }
                  return res.json({erro:"Not the vendor"});
                  
            }else if(req.userid == -1){
                  
                  return res.json({auth: false, message: 'No token provided.'});
            }else if(req.userid == -2){
                  
                  return res.json({auth: false, message: 'Failed to authenticate token.'});
            }
      }catch(err){
            console.log(err);
            await pool.query('Rollback;');
            return res.json({erro:err});
      }

}

const getEnvolved = async (req, res)=>{

      req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  const user= req.userid;

                  const creator = await pool.query('SELECT leilaoid FROM leilao WHERE utilizador_userid=$1',[user]);

                  const licitacao= await pool.query('SELECT DISTINCT leilao_leilaoid FROM licitacao WHERE utilizador_userid=$1',[user]);

                  

                  var arr = [];
                  for(const c of creator.rows){
                        arr.push(c.leilaoid);

                  }

                  for (const l of licitacao.rows) {
                        arr.push(l.leilao_leilaoid);

                  }

                  return res.json({envolved: arr});
                 

                  
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }

}

const getMensagens = async (req,res)=>{

      var userid = verifyJWT(req,res);

      try {
            if(userid>=0){
                  const mensagensnaolidas = await pool.query('SELECT texto, notifdate FROM mensagem WHERE utilizador_userid=$1 AND utilread=$2;',[userid,false]);
                  const mensagenslidas = await pool.query('SELECT texto, notifdate FROM mensagem WHERE utilizador_userid=$1 AND utilread=$2;',[userid,true]);
                  await pool.query('UPDATE mensagem SET utilread = $1 WHERE utilizador_userid = $2 AND utilread = $3;',[true, userid, false]);
                  return res.json({nonreadmessages: mensagensnaolidas.rows, readmessages: mensagenslidas.rows});
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }
      } catch (err1) {
            return res.json({erro: err1});
      }

};




const getStatistic = async (req, res)=>{

      req.userid = verifyJWT(req,res);
            
            if(req.userid>=0){
                  const user = await pool.query('SELECT admin FROM utilizador WHERE userid=$1',[req.userid]);
                  if(user.rows[0].admin){
                        const top_leilao_creators = await pool.query('SELECT utilizador_userid, COUNT(utilizador_userid) AS count FROM leilao GROUP BY utilizador_userid ORDER BY count DESC limit 10');
                        
                        const current = new Date();
                        const leiloes= await pool.query('SELECT * FROM leilao WHERE datafim <= $1 AND cancelar=false',[current]);
                        
                        

                        var arr = [];
                        for( const l of leiloes.rows){
                              const person = await pool.query('SELECT utilizador_userid FROM licitacao WHERE precodelicitacao==$1',[l.minpreco]);
                              arr.push(person.rows[0].utilizador_userid);
                        }

                        var top_leilao_winners= thisisnotgood(arr); // [userid, count], .....

                  
                        var dt= new Date();
                        dt.setDate( current.getDate() - 10 );
                        
                        // we are checking if there were any active the past 10 days, not checking if valid ("	número	total	de	leilões	nos	últimos	10	dias")
                        const count_leilao = await pool.query('SELECT COUNT(*) FROM leilao WHERE datafim >= $1 AND datacomeco <= $2 ',[dt,current]);

                        //console.log("top leilao creators:\n");
                        var arr1=[];
                        console.log(top_leilao_creators.rows);
                        for (const c of top_leilao_creators.rows) {
                              const person = await pool.query('SELECT username FROM utilizador WHERE userid=$1',[c.utilizador_userid]);
                              arr1.push([person.rows[0].username, c.count]);
                              console.log("P: "+ person.rows[0].username+ "\n");
                              console.log(arr1);
                        }
                        console.log(arr1);


                        //console.log("top leilao winners:\n");
                        var arr2=[];
                        if(top_leilao_winners.rows != null){
                              for (const c of top_leilao_winners.rows) {
                                    const person = await pool.query('SELECT username FROM utilizador WHERE userid=$1',[c[0]]);
                                    arr2.push([person.rows[0].username, c[1]]);
                              }
                        }
                        
                        return res.json({top_leilao_creators: arr1, top_leilao_winners: arr2, count: count_leilao.rows});
                        /* returns
                        [char username, int count] // top_leilao_creators
                        [char username, int count] // top_leilao_winners
                        int count                  // count active leiloes in the last 10 days
                        */

                  }else{
                        return res.json({auth:false, message: 'You are not admin'});
                  }
            }else if(req.userid == -1){
                  return res.json({auth: false, message: 'No token provided.'})
            }else if(req.userid == -2){
                  return res.json({auth: false, message: 'Failed to authenticate token.'})
            }

}


/* gets array of people who won, makes count, sorts it and returns top 10*/
function thisisnotgood(arr){
      // this is probably the worse way to do this but it should work kkkkk
      var aux = Array.from(new Set(arr)).map(a =>
            ({name:a, count: arr.filter(f => f === a).length}));
      var aux2= Object.entries(aux).sort((a,b) => b[1]-a[1]);
      return aux2.slice(0,10);
      
}




module.exports ={
      createUser,
      getLeiloes,
      Login,
      criarLeilao,
      getLeiloesByKeyword,
      updateLeilao,
      makeLicitation,
      getLeilaoByID,
      insertMural,
      banUser,
      cancelLeilao,
      getStatistic,
      getEnvolved,
      getMensagens
}
