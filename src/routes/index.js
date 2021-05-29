const {Router} = require("express");
const router = Router();
const {getMensagens,getEnvolved,getStatistic, banUser, cancelLeilao, getLeiloes,createUser,Login,criarLeilao,getLeiloesByKeyword, updateLeilao, getLeilaoByID,makeLicitation,  insertMural} = require("../controllers/index.controller");

//User
router.post('/dbproj/user', createUser);
router.put('/dbproj/user', Login);
router.get('/dbproj/user/historico',getEnvolved);
//Leilão
router.post('/dbproj/leilao', criarLeilao);
router.put('/dbproj/leilao/:leilaoId',updateLeilao);
router.get('/dbproj/leilao/:leilaoId',getLeilaoByID);
router.get('/dbproj/leilao/:leilaoId/:licitacao',makeLicitation)

router.put('/dbproj/leilao/:leilaoId/mural', insertMural);
router.get('/dbproj/user', getMensagens);
router.put('/dbproj/leilao/:leilaoId/cancel', cancelLeilao);
router.put('/dbproj/user/admin/ban', banUser);

router.get('/dbproj/estatisticas', getStatistic);

//Vários Leilões

router.get('/dbproj/leiloes',getLeiloes);
router.get('/dbproj/leiloes/:keyword',getLeiloesByKeyword);




module.exports = router;

