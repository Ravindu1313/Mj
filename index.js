const { File } = require("megajs");
const fs = require("fs");
const path = require("path");
const express= require("express");
const app = express();
const axios= require("axios");
const FormData=require("form-data");
const cors = require("cors");
const megaC= require('mega-link-checker')
const bodyParser = require('body-parser');
const bot = require("./tg");
const BOT_TOKEN = process.env.Token;
const channel=process.env.channel;
const owner=process.env.Owner;


var run=0;stopn=0;
var filetypes={jpg:"image",png:"image",gif:"image",jpeg:"image",svg:"image",bmp:"image",tiff:"image",ico:"image",webp:"image",mp4:"video",mp3:"audio",mkv:"video",webm:"video",flv:"video",avi:"video",mov:"video",MOV:"video"
};
sizelimits={M20:20971520,M50:52428800,M100:104857600,};
timingsSleep=1000;
var smethod={image:{method:"sendPhoto",name:"photo"},video:{method:"sendVideo",name:"video"},document:{method:"sendDocument",name:"document"},audio:{method:"sendAudio",name:"audio"}};

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
//Mjs cust..
File.defaultHandleRetries = (tries, error, cb) => {if (tries > 8)  {cb(error);} else {setTimeout(cb, 1000 * Math.pow(2, tries));}};

app.get("/",(req,res)=>{
  res.send("Hello World");
})

var fl=[];fll=[];dlp="download";var follf;

function cleardl(){
  directory=path.join(__dirname,dlp);
  fs.readdir(directory, (err, files) => {
  if (err) throw err;
  for (const file of files) {
    fs.unlink(path.join(directory, file), 
      (err) => {
      if (err) throw err;}); }});
  return 1;
}

const replacerFunc = () => {const visited = new WeakSet();return (key, value) => {
if (typeof value === "object" && value !== null) {
 if (visited.has(value)) { return;}visited.add(value);
if(value.constructor!=null){
if(value.constructor.name=="_File" 
   && value.directory==false){
  var {name,size,downloadId,key}=value;
  typex=filetypes[name.split(".").pop()];
  so={
    name:name,
    size:size,
    downloadId:downloadId,
    key:key,
    type:typex ? typex : "document",
  };
  if(so.type=="video"&&so.size<sizelimits.M50){
fl.push(so);
  }
  fll.push(so);
  }}}return value;};};

async function sendV(obj,res){
 formData = new FormData();
 formData.append('chat_id',channel);
formData.append('video',await fs.createReadStream(path.resolve(obj.fp)));
formData.append('caption',obj.file.name);response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, formData, {headers:{'Content-Type': 'multipart/form-data'},data:formData});
    return response.data.ok;
}

async function sendImg(obj,res){
 formData = new FormData();
 formData.append('chat_id',channel);
formData.append('photo',await fs.createReadStream(path.resolve(obj.fp)));
formData.append('caption',obj.file.name);response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, formData, {headers:{'Content-Type': 'multipart/form-data'},data:formData});
    return response.data.ok;
}

async function sendT(obj,res){
 formData = new FormData();
 formData.append('chat_id',channel);
formData.append('document',await fs.createReadStream(path.resolve(obj.fp)));
formData.append('caption',obj.file.name);response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, formData, {headers:{'Content-Type': 'multipart/form-data'},data:formData});
    return response.data.ok;
}

async function dl(did,fobj){
  return new Promise(async (res,rej)=>{
    fol = File.fromURL(flu=follf+"/file/"+did[1]);
    await fol.loadAttributes(async (error, ff) => {
      var ffpp=path.join(__dirname,dlp,ff.name);
      Ff=ff;
      console.log("doing: "+ff.name);
      stream= ff.download();
      stream.on('error', error => console.error(error))
      stream.on('progress', info => {
        console.log(info.bytesLoaded,"/",info.bytesTotal);
        if(info.bytesLoaded==info.bytesTotal){setTimeout(async ()=>{
         let start = fs.statSync(ffpp).size;
         if(start<info.bytesLoaded){
           //for err fix-->file replaced to ff...
           ff.download({ start }).pipe(fs.createWriteStream(ffpp, {flags: 'r+',start}));
         }else{
         console.log("dl done");
         if(fobj.type=="image"){
            rr=await sendImg({fp:ffpp,file:ff});
         }else if(fobj.type=="video"&&fobj.size<sizelimits.M20){
            rr=await sendV({fp:ffpp,file:ff});
         }else{
            rr= await sendT({fp:ffpp,file:ff});
         }
         if(rr==true){
            fs.unlinkSync(ffpp);
            console.clear();
         }else if(rr==false){
            fs.unlinkSync(ffpp);
            console.log("error on send-",ffpp);
         }
         res(rr);
      }},50);}});
   stream.pipe(
     fs.createWriteStream(ffpp)
   );})}) 
}

async function timingS(){
  if(stopn==0){
 data= fs.readFileSync('./files.json').toString();
  obj = JSON.parse(data);
  if(obj.files.length>0){
    file=obj.files.shift();
    x=await dl(file.downloadId,file);
    if(x==true){
      console.log("done",x);
      fs.writeFileSync(
    "files.json",
    JSON.stringify(obj));
      setTimeout(timingS,timingsSleep);
    }else{
      console.log("error on send");
      fs.writeFileSync(
    "files.json",
    JSON.stringify(obj));
      setTimeout(timingS,timingsSleep);
    }
  }else{
    console.log("no files");
    bot.telegram.sendMessage(owner,"Process finished!!😇");
    run=0;
  }
  }else{
    console.log("stopped!!!!");
    await cleardl();
    bot.telegram.sendMessage(owner,"process stoped!🙂\nBy You");
    stopn=0;
    run=0;
  }
}

async function loadMega(url) {
  run=1;follf=url;
  const folder = File.fromURL(url);obj={files:[]};
  await folder.loadAttributes();
  h=JSON.stringify(folder, replacerFunc());
  fg=fl.find(e=>e.size<=sizelimits.M50);
  console.log(folder.children.length);
  fs.writeFileSync(
    "files.json",
    JSON.stringify({files:fl})
  );
  fs.writeFileSync(
    "Allfiles.json",
    JSON.stringify({files:fll})
  );
  console.log(ctext=fll.length+" of files founded!\n and  "+fl.length+" of them can be uploaded to telegram");
  rt=`This is the Total extracted files from the link ${fl.length} of files I will send ${fg.length} files now`;
  spa=path.join(__dirname,"Allfiles.json");
  bot.telegram.sendDocument(owner,{source:spa,
caption:rt});
  run=1;
  timingS();
}

app.listen(3000,()=>{
  setTimeout(async ()=>{
  console.log("server started!");
  ddlp=path.join(__dirname,dlp);
  if (!fs.existsSync(ddlp)){
    fs.mkdirSync(ddlp);
    console.log("download path created!");
  }else{
    console.log("download path exists!");
    await cleardl();
    console.log("cleared dl path!");
  }
//ll="https://mega.nz/folder/2IlUSQwA#bMIrsQnNZtN5H6D2kcB_rA";
    /*console.log(await megaC(ll));;
    loadMega(ll);*/
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text === 'hello') {
    ctx.reply('Hello there! 😊');
  } else if(text =='/stop'){
    if(run==1){
    stopn=1;
    ctx.reply('Trying to  stop!!!🫡');
    }else{ctx.reply('Alredy stopped!😅');}
  }else{
    mc=await megaC(text);
    if(mc==true){
      await ctx.reply('Thats a valid link\nWorking!....');
      if(run==0){
        run=1;
        loadMega(text);
      }else{
        ctx.reply('I am alredy in a process!');
      }
    }else{
      ctx.reply('Give me a valid Mega link!😇');
    }
  }
});
    },3000);
})

