OP=self.opera ? 1 : 0
NC=!document.all
IE=!NC && !OP
MZ=!OP && navigator.product=='Gecko' && navigator.vendor!='Netscape6'	// Mozilla

errNoError = 0		// Must be zero
errNotFound = -1
errNoAccess = -2
errFatalErr = -3
errCookNoSpace = -4
errInvName = -5
errCantWriteDir = -6
errMissingName = -7
errBinFile = -8
errFileLocked = -9

errVarNotFound = -16
errOutOfBounds = -17
errInvIndex = -18
errInvVarName = -19
errNoHome = -20
errFewArguments = -21
errNoNumber = -22
errEvalError = -23
errInvSyntax = -24
errCantChmod = -25

var Mount = new Array();
var Device  = new Array();
var ROMount = 0;			// Флаг монтирования только R/O
var DelConf = 0;			// Подтверждение изменений на Extended
var ScrollDown = 1			// Cкроллинг экрана вниз при наборе текста.
var KeepHistory = 1			// Сохранять историю команд
var KeyDebug = 0			// Просматривать коды клавиш

var IOResult = errNoError;
var umask  = '-rwx';			// Маска по-умолчанию

var Files=new Array();
var Names=new Array('/bin/bc','/bin/vi','/bin/man','/bin/manual.jz','/bin/pwd','/bin/brow','/.rcjush','/tmp/','/.history','/bin/whoami',
'/bin/exit','/bin/navidaemon','/bin/pidaemon','/bin/su','/bin/fw',
'/bin/touch','/bin/read',
'/bin/history','/dev/null','/bin/fy','/dev/bmem',
'/dev/stat','/bin/garbdaemon','/dev/random', '/bin/ping')

var Access=new Array('-r-x','-r-x','-r-x','-r--','-r-x','-r-x','-rwx','-rwx','-rw-','-r-x',
'-r-x','-r-x','-r-x','-r-x','-r-x',
'-r-x','-r-x',
'-r-x','crw-','-r-x','crw-',
'crw-','-r-x','cr--', '-r-x')
var VarNames=new Array('path','home','pwd','prompt','prompt2','user','version','argv',
'cdpath','history')
var VarValues=new Array('(/bin /etc)','/','/','# ','> ','nobody',Ver,'()',
'/etc/',0)


var Chain = new stack()
var PIDs  = new stack()
var Stack = new stack()
var NaviStack = new stack()

Files[0]='if ($#) then\n#JS: $*\nelse\ndialog [] [if (LEN) {{bc PARM;echo -------}>stdout;bc}]\nendif';
Files[1]='#JS: Vi($%*)';
Files[2]='if ($#) then\nif ($%1=="?") then\necho \\? - shows all commands\nelse\njzip -d /bin/manual.jz|grep ^$1[^A-Za-z] -\nendif\nelse\necho Usage: man \\<command_name\\>\nendif';
Files[3]=
'command,keyword,alias,exit,message,standart,output,file,pattern,search,show,lines,only,name,disable,current,directory,content,expression,Example:,change,access,list,char,from,execute,link,moves,system,mode,delete,write,save,line,right,device,display,sets,mount,read,default,format,compress,user,number,variable,while,label,hash,jzip,tion,ternal,. Danger., ( for compatibility ).,<file>,engine., via , string, start, or , and !man <*A> - locates *As by *B lookup.\n'+
'? \n'+
'@ - *C of set *A.\n'+
'bye - logout*60*D.\n'+
'echo <*E> - *fs *Xaster*57s to *F *G.\n'+
'cat *54 [*54..] - concatenates*59*ks *Hs.\n'+
'grep [-cilvhd] <*I> *54 [*54..] *J <*I> in *H(s)*60*K found *L. -c - *K quantity found *L. -i - not case sensitivity. -l - *K *H*Ns *M. -v - *K *L not contained *I. -h - *K *N of *H*60*L. -s - *O *K errors.\n'+
'pwd - *K *P *Q.\n'+
'ls [-l1a] [<*Q] - *K *Q *R. -l - *K full *R. -1 - *K *R in 1 column. -a - *K all *H(s) (*60.*+ too. )\n'+
'bc <*S> - calculate simple *S. Func*y: +,-,/,*+,sin,cos,tan,log,exp,pow,sqrt,asin,acos,atan, Int - integral by Simphson method.*T bc sin(1)+cos(1)*+sqrt(3)+Int("sin(x)",0,1)*52\n'+
'clear - clears the terminal screen.\n'+
'chmod <0-7|<+|-><rwx>> - *U *V *is. 0-7 - bits-coded *V *is. <+|-> - enable/*O. rwx - Read/Write/eXecute.\n'+
'cd <*Q> - *U *Q.\n'+
'cp <*H1> <*H2> - copy one to other.cp <*H1> <*H2>.. <destdir> - copy *Hs to *Q.\n'+
'ln <old*a> <new*a> - *as *Hs.\n'+
'cut <*W> [-<*X>] <*H(s)> - cuts *Y <*H(s)> row(s) with *ss <*W>.-<*X> - symbol for separate result *W.*T cut 1-3,5 /bin/manual.\n'+
'brow <page> - opens web-<page>.\n'+
'mkdir <dir*N> - make *Q*53\n'+
'if (<*S>) <*A1>if (<*S>) then<*A1>;[<*A2>;...][else<*A3>;[<*A4..>;]]endif*Z <*A1>,.. if <*S> is true*60<*A3>,.. if it is false*52\n'+
'rm *54 [*54..] - erase *H(s)*60*a(s)\n'+
'mv <old*H> <new*H> - *b <old*H> to <new*H>.mv <*H1> <*H2>... <dest> - *b *Hs into directiory.\n'+
'wc [-clw] [Files...] - count quantity of *L (-l), words (-w)*60*Xasters (-c) in *H(s).\n'+
'scan - scan*60correct *H *c error (jsfs *M).\n'+
'vi <*H*N> - VIsual editor. Editor for small *Hs.keys: a - append ( switch to text *d ),Backspace - *e *X,Esc - switch to *A *d,w - *f to *H ( *g ),q - quit.i - insert new *h.x - set "x" *V *i to *H.\n'+
'load *54 - load JSFS *H *c *Y local *med *j.\n'+
'*g *54 - *g JSFS *H *c to local *med *j.\n'+
'rmdir <dir*N> - remove *Q*53\n'+
'tee *54 - get input stream, *g it to *54*60*G it.\n'+
'# <text>; - comment.\n'+
'set [-rwqxsfBb] - *k all *ts*59*l some op*ys. -r - *m *n *d *M. -w - *m *n/*f *d (*o). -q - query for *U data on extended *js. -x - not query... (*o) -f - don\'t scroll down when *G. -s - scroll... (*o). -b - enable b*a cursor. -B - *O... (*o).\n'+
'*D - logout*60*D.\n'+
'date [+<*p>]- *k *P date.\n'+
'eval - replace all *ts*60*Z *A.\n'+
'fg <JobsID> - runs jobs in foreground.\n'+
'ps - *Ks *P status of processes.\n'+
'more [<*H*N>] - *Ks *H *R one screen at a time.keys:<Enter> - continue.:q<Enter> - *D.other - *Z shell *A.\n'+
'sed  [-n] [-e <script>] [-f <f*H>] ... [*54 ...] - see inwww.citforum.ru\n'+
'kill <JobsID> - kills jobs.\n'+
'*q [-d] <*H(s)> - *qes*59de*qes (if key "d" *l) *H to *F *G. Use RLE *qion.\n'+
'su [<*r>] - *Us *P *r.\n'+
'mail [<*r> <*E>] - sends mail to the *r.\n'+
'whoami - *Ks *P *r *N.\n'+
'fw [<*B(s)>] - *J*56AllTheWeb *J *55\n'+
'fy [<*B(s)>] - *J*56Yandex *J *55\n'+
'icq [<nick>] [<ICQ *s>] - *l ICQ *C.icq -a - *Ks all ICQ *Ces.icq [<ICQ *s> | <nick>] [<*E>] - sends ICQ *E.\n'+
'tail [-l]|[-b]|[-c] [-]|[+] [<*s] *54 - *fs a *H to *F *G, beginning at a specified point.-b - 512-byte block loca*y indicated by the <*s> *t.-c - bytes...-l - *L...\n'+
'touch <*H*N> - creates *H.\n'+
'where <*H*N> - locates path(s) to *H*N.\n'+
'unset <*I> - *es*ts.\n'+
'un*C <*I> - *es *Ces.\n'+
'*C [<*A> [<*C>]] - *l*59*Ks *C for *A.\n'+
'shift <array_*t_*N> - shift left *R of array.\n'+
'*m [[-r] <*H_*c> <*Q>] - makes a *H *c available for use*59*K *Ply *med *H *cs.-r - *n *M *d.\n'+
'un*m <*Q> - un*m a previously *med *Hs *c.\n'+
'*n <var*N> - *ns one *h *Y *F input to <var*N>.\n'+
'*u (<*S>)<*A1>;[<*A2>;...]end - *Zs *As *u *S is true.\n'+
'break - breaks "*u" loop.\n'+
'repeat <n> <*A> - repeats <*A> <n> times.\n'+
'wish <*H*N> - this is shell for Windows\' programs.Works on Windows 98/ME/2000/XP/NET*60IE5+ *M.\n'+
'foreach <var> (<*W>)<*As>end - sequentially assigns a *t <var> values *Y the <*W> (are divided by a blank)*60*Zs *As.\n'+
'continue -*58s new itera*y of cycle.\n'+
'goto <*v> - Does transi*y to the *v.A *v is the*57*58ing with ":".\n'+
'id - *k *P *r.\n'+
'u*N [-s] [-n] [-r] [-v] [-m] [-a] - print *c in*pion.-m - machine type.-n - machine\'s network node host*N.-r - opera*yg *c realise.-s - *c *N.-v - operating *c version.-a - all of the above in*pion.\n'+
'mkfifo *54 ... - Makes first-in-first-out (FIFO) special *H.\n'+
're*w - causes the in*z *w table of the *R of the directories path *t.\n'+
'd -a|-s|-p|-l|-m|-u|-o <parms> - utility for JUnix dging.-s - *Ks JavaScript *t *R. *T d -s WD-p - gets JS *t *Y stack. *T d -p WD-u - puts JS *t on stack. *T d -u WD-a - *Ks JS alert. *T d -a WD-l - *Ws JS object. *T d -l document-m - *b value to JS *t. *T d -m WD "/bin"-o - opens JS window. *T d -o Hnd http://junix.kzn.ru\n'+
'un*w - *O use of the in*z *w table to speed loca*y of *Zd programs.\n'+
'df - *Ks total*60free disk sizes.\n'+
'source <*H1> [<*H2> ... ] - *Zs ex*z *H as jush script.\n'+
'*x [-d] <*H(s)> - *x*59un*x (if key "d" *l) *H to *F *G.\n'+
"ping [-c count] <host> - ping host thru 80 port.Warning: if host doesn't exists ping *Ks it alive anyway.\n"

Files[4]='#JS: WD';
Files[5]='if ("$1"=="-a") then\nif ([-e /etc/.bookmarks]) sed -e s/\\\\s/\\ -\\ / /etc/.bookmarks\nelse\nif ("$1"=="-d") then\ngrep -v ^$2 /etc/.bookmarks>/etc/.bookmarks\n'+
'else\nif ($#==1) then\ngrep ^$1 /etc/.bookmarks|cut 2>/tmp/brow.tmp\nset browline=`wc -c /tmp/brow.tmp`\n\nif (!"$browline[*]") then\n'+
'set browline=$1\nelse\nset browline=`cat /tmp/brow.tmp`\nendif\n#JS: OpenPage("$browline[*]")\nelse\n'+
'if ($%1 and $%2) echo $1 $2>>/etc/.bookmarks\nendif\nendif\n\nunset browline\nrm /tmp/brow.tmp>/dev/null\nendif'
Files[6]='kill all>/dev/null\n{garbdaemon&}>/dev/null\n{navidaemon&}>/dev/null\nmount /dev/local /usr>/dev/null\nmount /dev/cookie /etc>/dev/null\nclear\necho +---------------------------+\\nI  Welcome to JUnix v$version. I\\n+---------------------------+';
Files[7]='-----'
Files[8]='';			// File of history
Files[9]='#JS: login';
Files[10]='bye';
Files[11]='#JS: {Navi();NaviStack.length}';
Files[12]='if ($?pi1) then\n\nif ($pi gt Math.PI) then\nset pi2=`bc $pi2+1`\nelse\nset pi1=`bc $pi1+1`\nendif\n\nset pi=`bc $pi1/$pi2`\necho $pi>/dev/stat\nelse\nset pi1=3 pi2=1 pi=3\nendif';
Files[13]='if (!$#) then\ndialog [Enter user name: ] [su PARM]\nelse\n#JS: {login="$1";st=PassStd;Type("Enter password: ");""}\nendif';
Files[14]='if ($#) then\n#JS: OpenPage("http://www.alltheweb.com/cgi-bin/search?type=all&query="+$%*,"width=600,height=400,scrollbars=1")\nelse\ndialog [Search for: ] [fw PARM]\nendif';
Files[15]='>$*';
Files[16]="if ($#) dialog [] [set $1=PARM]"
Files[17]='if ([-e $home.history]) cat $home.history'
Files[18]="Object,null"
Files[19]='if ($#) then\n#JS: OpenPage("http://www.yandex.ru/yandsearch?ctgl=11657&ssa=0&text="+$%*,"width=640,height=400,scrollbars=1")\nelse\ndialog [Search for: ] [fy PARM]\nendif'
Files[20]="Object,null"
Files[21]='Object,null'
Files[22]='#JS: if (typeof(CollectGarbage)!="undefined") CollectGarbage()'
Files[23]='Object,null'
Files[24]='if (NaviCheckBrowser()) then\necho ping: Your browser does not support the command.\ngoto END\nendif\nif ($#) then\n\nif ($#==2 or $# gt 3) then\necho Invalid argument.\n#JS: EL(7)\ngoto END\nendif\n\nif ($%1=="-c" and $%2) then\nset host=$%3\nset count=$%2\nelse\nset host=$%1\nset count=4\nendif\n\necho PING $host (port 80) from JUnix : ~820 bytes of data.\ndialog [] [ ];#JS: {ping=$count;SetNavi("http://"+$host)}>/dev/null\nelse\ndialog [Enter distination host: ] [if (LEN) ping PARM]\nendif\n\n:END'

var WD='/';
var errorlevel=0;
var Screen='';
var input='';
var stdout='stdout',stdin='stdin',stderr='stderr';
var hig=14;		// высота экрана
var st=UserStd;		// Состояние системы
var TTL=20;		// Max. kоличество вложенных комманд.
var edcurr='',edcurs=0;
var vimode=1;		// Режим редактора
var viname='';		// Имя редактируемого файла

with (navigator)
if (/Opera\s+([\d\.b]+)/.test(userAgent) ||
/Netscape6\/([\d\.b]+)/.test(userAgent) ||
/rv:([\d\.\+]+)/.test(userAgent) ||
/MSIE ([\.\db]+)/.test(appVersion) ||
/^((\d|\.)+)/.test(appVersion)) Version = RegExp.$1; else Version=parseInt(appVersion)

var ctrl=0;		// Был нажат Ctrl
var dialog=0;		// Диалоговый режим
var prompt='';		// Подсказка для диалогового режима
var dlgcom=';';		// Команда после диалогового режима
var chaincnt=0;		// Счетчик для фонового процесса
var daemoncnt=0;	// Счетчик демонов
var daemoncur=0;	// Текущий демон
var pHnd=null;		// Хэндл для контроля за нажатием на клавиши (для chain)
var pmore=0;		// Откуда начинать more (position).
var cache=null;		// массив для команды more.
var wid=60;		// Ширина экрана ( в символах ).
var HTA=/hta$/i.test(location.href);
var password;		// Текущий пароль
var login;		// Текущее имя
var offset=0;		// Смещение в буфере ввода
var selstart=0;		// Смещение для выделения
var curchain=0;		// Текущий элемент в бакграунде.
var lock=0;		// Блокировка клавиатуры
var lockout=0;		// Блокировка вывода на экран
var clipboard='';	// Clipboard for IE4 и NC
var scriptname = "jush"; // Haзвание текущего скрипта
var pipeout = "";	// Переменная для вывода через pipe
var pipefile = "";	// Данные, выводимые через pipe
var Break = new stack();// Стек флагов для команды break
var keypressed = 0	// Клавиша нажата?
var keydown = 0		// Флаг того, что прошло событие keydown
var XBOCT = ""		// Конечная строка после Screen
var jhistory = 0	// Текущая пара строчек в history
var curnavi = 0		// Текущий вывод в navi-objs
var PID = 0		// Текущий PID
var cursor = "\uE011";	// Текущий вид курсора
var bcursor = ""    // Погашенный курсор
var ocursor = "\uE011";	// Общий вид курсора
var cHnd = null;	// Handle обработчика курсора
var bHnd = null		// Handle обработчика бага *NIX NC
var label = "";		// Текущая метка, к которой осуществляется переход
var alias = "";		// Текущая замена alias
var minus = "";		// для команды -
var ping = 0		// флаг - запущена комманда ping ее значение - количество нужных пингов
var pingto = 1500	// timeout для ping в ms

// Для Нетскапы кривой
var CODES="                                 !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~      :   % <          --                                        АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя";

// Расширяем String.

// разделение на массив через неэкранированные пробелы
function snsplit()
{
	var spc = arguments.length?arguments[0]:" ", nspc = spc
	if (NC && Version>=5 || MZ) nspc = new RegExp(spc)
	var Out = new Array(),Str = this.split(nspc)

	var le = Str[Str.length-1]
	if (Str.length==1) return new Array(Str[0])

	Out[0] = Str[0]
	for (var i = 1; i<Str.length; i++)
	if (Str[i-1].l()=="\\")
	Out[Out.length-1]+= spc+Str[i]; else
	Out[Out.length] = Str[i]

	return Out
}


String.prototype.m = new Function("s","return this.indexOf(s)>=0")
String.prototype.nm = new Function("s","return this.indexOf(s)<0")
String.prototype.c = new Function("s","return this.charAt(s)")
String.prototype.l = new Function("s","return this.charAt(this.length-1)")
String.prototype.lz = new Function("l",'var str = this;while (str.length<l) str = "0"+str;return str')
String.prototype.rec = Recode
String.prototype.dec = DeRecod
String.prototype.snsplit = snsplit

// Мат. ф-и

abs=Math.abs;
sin=Math.sin;
cos=Math.cos;
tan=Math.tan;
log=Math.log;
exp=Math.exp;
pow=Math.pow;
round=Math.round;
sqrt=Math.sqrt;
pow=Math.pow;
asin=Math.asin;
acos=Math.acos;
atan=Math.atan;

// Объект stack
function push(val)
{
	this[this.length] = val
	this.length++
}

function pop()
{
	var t,l=this.length
	if (l)
	{
		t = this[l-1]
		delete this[l-1]
		this.length--
	}
	else t = 0
	return t
}

function top_()
{
	return this[this.length-1]
}

function find(val)
{
	for (var i = 0;i<this.length;i++) if (val==this[i]) return i
	return -1
}

function del(idx)
{
	if (this.length)
	{
		for (var i = idx+1; i<this.length; i++)
		this[i-1] = this[i]

		this.length--
		delete this[this.length]
	}
}

function unshift(val)
{
	for (var i = 1; i<=this.length; i++)
	this[i] = this[i-1]
	this[0] = val
	this.length++
}

function rep(val)
{
	if (this.length)
	this[this.length-1] = val
}

function clear()
{
	for (var i = 0; i<this.length; i++) delete this[i]
	this.length = 0
}

function stack()
{
	this.length = 0
	this.push = push
	this.pop  = pop
	this.find = find
	this.top  = top_
	this.del  = del
	this.rep  = rep
	this.unshift = unshift
	this.clear= clear
}
// Конец описания объекта stack

// Взять вид текущей подсказки
function P()
{
	var ps = GetRealVar2('prompt')
	if (ps.m('%'))
	{
		ps = ps.replace(/%\//g,"$pwd").replace(/%[mM]/g,"localhost").replace(/%t/g,"`date +%r:%M`")
		ps = ps.replace(/%T/g,"`date +%%H:%%M`").replace(/%p/g,"`date +%%r:%%M:%%S`").replace(/%P/g,"`date +%%T`").replace(/%n/g,"$user")
		ps = ps.replace(/%d/g,"`date +%%a`").replace(/%D/g,"`date +%%d`").replace(/%w/g," `date +%%h`")
		ps = ps.replace(/%W/g,"`date +%%m`").replace(/%y/g,"`date +%%y`").replace(/%Y/g,"`date +%%f`").replace(/%#/g,"#")
		ps = ps.replace(/%%/g,"%")
	}
	if (ps.m('$')) ps = ReplaceAllVars(ps)
	if (IOResult) return IOResult = errNoError, ""
	if (ps.m('`')) ps = ReplaceW(ps)
	if (IOResult) return IOResult = errNoError, ""	
	return ps
};

function Int(func,a,b)
{
	var h=0.002, out=0, x
	for (var i=a;i<=b;i+=h)
	{
		x=i
		out+=eval(func)
		x=i+h/2
		out+=4*eval(func)
		x=i+h
		out+=eval(func)
	};
	return h*out/6
};

// Ширина экрана в символах
function Width()
{
	if (NC) return (Math.floor(window.innerWidth/12))
	return (Math.floor(document.body.clientWidth/12))
};

// Высота экрана в символах
function Height()
{
	if (NC) return (Math.floor(window.innerHeight/24))
	return (Math.floor(document.body.clientHeight/24))
};


// Тип процессора
function TypeCPU()
{
	var vendors = {
		'Google Inc.': { 'OPR': 'Opera', 'Chrome': 'Chrome'},
		'Apple Computer, Inc.': {'Version': 'Safari'}
	};

	for (var vendor in vendors) {
		if (navigator.vendor == vendor) {
			for (var code in vendors[vendor]) {
				var re = new RegExp(code+'/(\\d+\\.\\d+)');
				if (re.test(navigator.userAgent)) {
					Type(vendors[vendor][code]+' '+RegExp.$1+' detected');
					return;
				}
			}
		}
	}

	if (OP)
	var browser = 'Opera'; else
	var browser = NC?'Netscape Navigator':navigator.appName
	var locver  = Version

	if (MZ)
	if (navigator.vendor=='') browser = 'Mozilla'; else
	browser = navigator.vendor, locver = navigator.vendorSub

	if (NC) window.offscreenBuffering=true, window.frameRate=1
	Type(browser+' '+locver+' detected.')
};

// Выводит на экран заданное число строк ( и возвращает позицию)
function More(str)
{
	if (pmore && cache!=null)
	{
		if (str == ":q") return pmore = 0,""
		if (str != "")   Exec(str)
	} else
	cache = Cutter(str.rec()).split("<BR>")

	Brow(Screen = cache.slice(pmore, pmore+=hig).join("<BR>"))

	if (pmore>cache.length) pmore = 0, cache = null; else
	Run('dialog [--more--] [#JS: More("PARM")]')
	
	return ""
}

// Открывет страницу в окне
function OpenPage(s)
{
	if ((s.nm('.')) && (s.nm(':'))) s='www.'+s+'.com'; else
	if (s.c(0)=='.') s='www'+s+'.ru'
	if (s.nm(':')) s='http://'+s
	var parms = arguments.length>1?arguments[1]:""

	/*@cc_on @*/
	/*@if (@_jscript_version>4)
		try {window.open(s,'',parms)} catch (e) {};
	@else @*/
		window.open(s,'',parms)
	/*@end
	@cc_off @*/

	return s=""
};


// Выводит поле редактора
function Vi(name)
{
	if (name=='') {EL(3);return "\nMissing argument."}
	var acc = faccess (viname = FullName(name))

	if (IOResult!=errNotFound)
	{
		if (IOResult) return "vi: "+ErrorMsg(IOResult)
		if (acc.nm ('w')) {EL(8);return 'vi: This file is read only.'}

		input = fget (viname)
		if (IOResult) return "vi: "+ErrorMsg(IOResult)
	} else
	{
		fput (viname, '')
		var lerr = IOResult
		fdelete (viname)
		if (lerr || (lerr=IOResult))  return "vi: "+ErrorMsg(lerr)
	}

	Clear()
	XBOCT = "\n\n:"
	Write("")
	st = ViedStd, vimode = 1
	return ''
};


// Перекодировка спецсимволов в HTML
function Recode()
{
	return this.replace(/\&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;").replace(/[ \x00]/g,"&nbsp;").replace(/\t/g,"&nbsp;&nbsp;").replace(/[\n]/g,"<BR>")
}

function DeRecod()
{
	return this.replace(//g,'\n').replace(/<BR>/g,'\n').replace(/\&nbsp;/g,' ').replace(/\&amp;/g,'&').replace(/\&gt;/g,'>').replace(/\&lt;/g,'<')
}

// Осуществляет перенос строк

function Cutter(str)
{
	str=str.dec()
	if (str.length<=wid) return str.rec()
	var out = "",p
	while (str != "")
	{
		if ((p = str.indexOf("\n"))<0) p = str.length
		if (p>wid)
		out+= str.substring(0,wid)+"\n",
		str = str.substr(wid); else
		out+= str.substring(0,p+1),
		str = str.substr(p+1)
	}
	return out.rec()
};

function Err(s)
{
	fput('stderr',s);
};

// Вывод в окно браузера
function Brow(s)
{
	if (!NC || Version>=5 || MZ) s = s.replace(/\uE011([^&\uE00F<]|\&\w+;)/,"<U>$1</U>")
	s = s.replace(/\uE011/,"<U>&nbsp;</U>")
	s = s.replace(/\uE00F\uE001/g,"<FONT COLOR=green>").replace(/\uE00F\uE002/g,"</FONT>")
	s = s.replace(/\uE00F/,'<SPAN STYLE="background-color:green">')
	s = s.replace(/\uE00F/,"</SPAN>")
	s = s.replace(/<BR><BR>/g,"<BR>&nbsp;<BR>")

	if (document.getElementById)
	document.getElementById('text').innerHTML = s; else
	if (IE) document.all.text.innerHTML=s; else
	if (document && document.layers && document.layers.text && document.layers.text.document)
	with (document.layers)
	{
		text.document.close()
		text.document.open('text/html','replace')
		text.document.write('<FONT STYLE="font-family:\'Lucida Console\';font-size:19px">'+s+'</FONT>')
		text.document.close()

	}
}

// Очистка экрана
function Clear()
{
	scrollTo(0,0)
	if (!MZ)
	if (NC && Version<5) document.height=window.innerHeight
	Brow(Screen='')
	if (IE) document.all.text.focus()
	return ''
};

// Вывод на экран

function Write(str)
{
	ctrl = 0
	if (lockout)
	intext = cursor,input+=str; else
	{
		var intextL=input.substring(0,offset);
		var intextR=input.substring(offset);

		input=intextL+str+intextR;
		offset+=str.length;
		if (str!="") selstart = offset
		if (IE || NC && Version>5 || MZ)
		{
			if (selstart>offset)
			intextR="\uE00F"+intextR.substring(0,selstart-offset)+"\uE00F"+intextR.substring(selstart-offset); else
			if (selstart<offset)
			intextL=intextL.substring(0,selstart)+"\uE00F"+intextL.substring(selstart)+"\uE00F";
		};

		var intext=intextL+str+cursor+intextR;

	};
	var p = Screen.lastIndexOf('<BR>')

	if (p>=0) Brow(Screen.substr(0,p+4)+Cutter(Screen.substr(p+4)+(intext+XBOCT).rec())); else
	Brow(Cutter(Screen+(intext+XBOCT).rec()))

	if (NC && document.layers && document.layers.text && (document.text.clip.height>window.innerHeight))
	document.height=document.text.clip.height+90
	if (ScrollDown && str!="") scroll(0,10000)
};

// Сброс буфера
function Flush()
{
	var p=Screen.lastIndexOf('<BR>');
	if (p>=0)
	Screen=Screen.substr(0,p+4)+Cutter(Screen.substr(p+4)+input.rec()); else
	Screen=Cutter(Screen+input.rec());
	input='';
	selstart=offset=0;
	Write('');
};


// Удаление символа

function DeleteChar()
{
	if (input!='')
	{
		input=input.substr(0,offset-1)+input.substr(offset);
		selstart=--offset;
		Write('');
		
	};
};

// Печать со сбросом
function Type(s)
{
	Write(s),Flush();
};

function RLECompress(str)
{
	var c,p,out='';
	for (var i=0;i<str.length;i++)
	{
		c=str.c(i);
		for (p=i;(p<str.length) && (str.c(i)==str.c(p));p++);
		if (p-i-1>255) p=255;
		if (p-i-1>0)
		out+=c+c+String.fromCharCode(p-i),i=p-1; else
		out+=c;
	};
	return out;
};
function RLEDecompress(str)
{
	var out='',c,j;
	for (var i=0;i<str.length;i++)
	{
		c=str.c(i);
		if ((c==str.c(i+1)) && (i+1<str.length))
		{
			for (j=str.charCodeAt(i+2);j>0;j--) out+=c;
			i+=2;
		}
		else out+=c;
	};
	return out;
}

// Замена переменных в диалоге
function DialogRep(dlgcom,str)
{
	return dlgcom.replace(/PARM/g,str.replace(/([<>\|;\{\}])/g,"\\\\$1")).replace(/LEN/g,str.length)
}

if (NC)
{
	window.captureEvents(Event.KEYPRESS | Event.KEYUP | Event.KEYDOWN);
	window.onkeypress = KeyPress
	window.onkeydown = KeyDown
	window.onkeyup = KeyUp
	window.cancelBooble = true
}

function KeyDown(event)
{
	if (document.body.focus && event.keyCode == 9) document.body.focus()
	keypressed = 0
	keydown = 1
}

function KeyPress(event)
{
	// Предотвращает срабатывание в Opera и Mozilla 1.3+ стандартных клавиатурных
	// макросов (например, "p")
	if (event.preventDefault) event.preventDefault()

	chaincnt = 0, TTL = 20
	if (lock) return true
	var mod, key, chr

	if (arguments.length>1) key = arguments[1]; else

	if (IE)
	key = event.keyCode; else
	key = event.which,
	mod = event.modifiers

	if (!key)
	if (mod==2)
	{
		if (ctrl) key = 6001; else
		if (!MZ && NC && Version<5)
		return ctrl = 1,true
	} else return true
	keypressed = 1
	ctrl = 0

	if (OP || IE || NC && Version>=5 || MZ)
	mod = event.shiftKey?4:0 + event.ctrlKey?2:0 + event.altKey?1:0,
	chr = String.fromCharCode(key); else chr = CODES.charAt(key)

	if (KeyDebug) console.log(window.status = "Key vk code: "+key+". Symbol: "+chr+". Prefix: "+mod)

	if (ScrollDown && key!=6034 && key!=6033) scroll(0,10000)
	st (key, chr, mod)
	return true
}

function KeyUp(event)
{
	if (IE) var key = event.keyCode; else var key = event.which
	if (!keypressed || !keydown)
	{
		keypressed = 1
		keydown = 0

		if (key==13) return KeyPress(event, key)	// for Beonex
		if (key!=16 && key!=17)
		return key?KeyPress(event,6000+key):true
	}
	keydown = 0
}

function KeyProcced(key,chr,mod)
{
	switch (key)
	{
		case 27:	return ""
		case 13:	return "\n"
		case 8:
		case 6008:	return DeleteChar(),""

		case 57375: // left
		case 6037:	if (offset>0) offset--;
				if (!(mod & 4)) selstart=offset
				return 0

		case 57376: // right
		case 6039:	if (offset<input.length) offset++
				if (!(mod & 4)) selstart=offset
				return 0

		case 57370: // end
		case 6035:	offset = input.length
				if (!(mod & 4)) selstart = offset
				return 0

		case 57369: // home
		case 6036:	offset = 0
				if (!(mod & 4)) selstart = 0
				return 0

		case 6045:	if (mod & 4)
				{
					selstart = offset
					return GetBuffer()
				} else
				if (mod & 2)
				{
					var text=input.substring(selstart,offset)
					SetBuffer(text)
					selstart = offset
					return 0
				}

		case 57383:	// backspace
		case 6046:	if (mod & 4)
				{
					if (offset==selstart) return 0
					if (offset<selstart)
					{
						var str = input.substring(offset,selstart)
						input = input.substring(0,offset)+input.substr(selstart)
						selstart = offset
					} else
					{
						var str = input.substring(selstart,offset)
						input = input.substring(0,selstart)+input.substr(offset)
						offset=selstart
					}
					SetBuffer(str)
					return 0
				}

				if (input.length)
				input = input.substr(0,offset)+input.substr(offset+1)
				selstart=offset
				return 0

		case 57374: // down
		case 6040:	if (offset<input.length)
				{
					var len = 0
					if (input.c(offset)=='\n') len++
					for (; offset-len>=0 && input.c(offset-len)!='\n'; len++);

					offset = input.indexOf('\n',offset)
					if (offset<0) offset = input.length; else
					{
						var curo = input.indexOf('\n', offset+1)
						if (curo<0) curo = input.length

						if ((curo-= offset)<len) len = curo
						offset+= len
					}

					if (!(mod & 4)) selstart = offset
				}
				return 0

		case 57373: // up
		case 6038:	if (offset>0)
				{
					var len = 0
					if (input.c(offset)=='\n') offset--, len++
					for (; offset>=0 && input.c(offset)!='\n'; len++, offset--);

					var pen = 1
					for (offset--; offset>=0 && input.c(offset)!='\n'; offset--, pen++);
	  
					if (pen<len) len = pen
					if (0>(offset+=len)) offset = 0

					if (!(mod & 4)) selstart = offset
				}
				return 0


		case 6067:	if (mod!=2) return 0
		case 6003:	// NC
		case 20:	if (st!=UserStd && st!=PassStd)
				st = WorkStd, key==20?Exec("fsck"):"",
				lock = lockout = dialog = 0, input = "",
				Break.clear(), Stack.clear(),
				Type(key==20?"System raised.\n"+P():"^C\n"+P())
				return 0

		// Ctrl+K
		case 11:
			Clear();Type(P());
			return 0;

		case 6082:	if (mod & 2) Run('restart')
	}

	selstart = offset
	return key>5999?0:chr
}

function UserStd(key,chr,mod)
{
	if (key == 13)
	offset = selstart = input.length,login = input,Type("\n"),MountList(),st=PassStd,Type("Password: "); else
	{
		var res = KeyProcced(key,chr,mod)
		if (res) selstart = offset,Write(res); else Write("")
	}
	return ""
}

function PassStd(key,chr,mod)
{
	if (key==13)
	{
		offset = selstart = input.length
		if (login=="") login = "nobody"
		password = input, input = ""
		SetLogin(login,password)
		if (fexists("/.rcjush"),!IOResult) Type(Exec("jush /.rcjush;cd")+"\n")
		if (fexists("/etc/profile"),!IOResult) Type(Exec("jush /etc/profile")+"\n")

		if (fexists ("/etc/daemon.cf"),IOResult) fput ("/etc/daemon.cf","navidaemon	ICQ and mail daemon\ngarbdaemon	Collect garbage daemon")
		Type(P()),st = WorkStd
		lockout = 0
	} else
	{
		var res = KeyProcced(key,chr,mod)
		if (res) input+=res
	}
	return ""
}

function WorkStd(key,chr,mod)
{
	if (key==13 && (input.l()!="\\" && input.l()!="|" || input.c(input.length-2)=="\\"))
	{
		var str = input
		offset = selstart = input.length
		Type("\n")
		var reg1 = new RegExp("\\\\\\n"+GetRealVar2('prompt2'),"g")
		var reg2 = new RegExp("\\|\\n"+GetRealVar2('prompt2'),"g")
		str = str.replace(reg1," ").replace(reg2,"|")
		if (str != "" && KeepHistory)
		{
			var hist = fget("/.history")
			if (IOResult) hist = ""
			hist+= new Date()+"\n"+str.replace(/[\r\n]/g,"")+"\n"

			if (hist.length>1024)
			{
				hist = hist.substr(hist.length-512)
				var Hist = hist.split(/\n/)
				hist = Hist.slice(2+(Hist.length & 1)).join("\n")+'\n'
			}

			fput("/.history",hist)
			SetVar("history",jhistory = (hist.split("\n").length>>>1))
			delete hist
		}

		if (dialog) str = DialogRep(dlgcom,str),dialog=0

		var out = Exec(str)
		Write(out)

		if (st==WorkStd)
		{
			if (!(out=="" || dialog || out.l()=="\n")) Write("\n")
			Flush()
		}

		if (dialog) Type(prompt); else
		if (st==WorkStd && !lock) Type(P())
	} else
	if (key==9 || key==6009 || key==6001)
	{
		ctrl = 0
		input = SearchPath(input)
		offset = selstart = input.length
		Write("")
		return false
	} else
	if (key==6038 || key==6040 || key==5 || key==6024 || key==24)
	{
		var hist = fget("/.history").split("\n")
		if (!IOResult)
		{
			var hn = key&8?jhistory+1:jhistory-1
			var n = 1+(hn<<1)
			if (n<=hist.length && n>-2) // Для крайних, пустых команд <= и >-2
			{
				jhistory = hn
				if (n<hist.length && n>0)
				input = hist[n]; else input = ""
			} else input = ""
			selstart = offset = input.length
			Write("")
		}
	} else
	{
		if (key==13)
		{
			offset = selstart = input.length
			var res = GetVar("prompt2")
			if (IOResult) res = ""
			res = "\n" + res
		} else
		var res = KeyProcced(key,chr,mod)
		if (res)
		Write(res); else Write("")
	}
	return ""
}

function ViedStd(key,chr,mod)
{
	var viadd = ""
	if (key==27 || key==6027) vimode = 1, vicom = ""; else
	{
		var res = KeyProcced(key,chr,mod)
		if (vimode)
		switch(res)
		{
			case ':': break
			case "q": input = viadd = XBOCT = ""
				  st = WorkStd; Type(P());return
			case "x":
			case "w": fput(viname,input)
				  if (IOResult) viadd = ErrorMsg(IOResult); else
				  {
					viadd = input.length+' byte(s) written.'
					if (res=='x') {viadd+= " Access rights was changed.";Run("chmod +x "+viname)}
				  }
				  break
			case "a": res = vimode = 0;break
			case "i": Write("\n");res = vimode=0;break
			case "8": KeyProcced(6038,chr,mod);break
			case "2": KeyProcced(6040,chr,mod);break
			case "4": KeyProcced(6037,chr,mod);break
			case "6": KeyProcced(6039,chr,mod);break

			default: vimode = 0
		}

		if (!vimode && res) selstart = offset,Write(res)
	}
	XBOCT = "\n\n"+(vimode?":":"-- INSERT --")+viadd
	Write("")
	return ""
}

// Работа с буфером обмена
function SetBuffer(str)
{
	if (IE)
	for (var i = 0; i<10000; i++) str+=""
	if (IE && Version>=5) clipboardData.setData('Text',str)
	else clipboard = str	
}
function GetBuffer()
{
	var buf

	buf = IE && Version>=5?clipboardData.getData('Text'):clipboard
	if (st != ViedStd) buf = buf.replace(/\n/g, ' ').replace(/\r/g,'')

	return buf
}
