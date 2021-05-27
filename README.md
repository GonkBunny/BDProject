# BDProject

```
├───database
│
└───src
    ├──dbproj.js -> main
    │
    ├───controllers -> functions (Brain), multiple js files if needed where we store functions
    │   └───index.controller.js 
    ├───models -> Classes
    │   └───User.js
    └───routes -> rotas no webbrowser disponiveis e que são encaminhadas para o brain
        └───index.js
```

### Para correr o servidor: 
```npm run dev <=> nodemon src/dbproj.js```

### Packages para instalar: 
* pg 
```npm i pg```
* express
```npm i express```
* jwb
```npm i jsonwebtoken ```

instructions/user manual: https://docs.google.com/document/d/1vdU7fYYCM6gBmq-fjM0To8B_0JaU60YOEv_RVBW85d8/edit?usp=sharing
