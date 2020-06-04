// Чтение из файла описаний процессов
function GetDescr (n)
{
	var s = fget ('/etc/daemon.cf'), i, S
	if (!IOResult)
	{
		S = s.split (/\n/)
		for (i in S)
		{
			s = S[i].split (/	+/)
			if (s[0]==n) return '#'+s[1]
		}
	}
	return ''
}

// Производит замену примитивов (-l name)
function PriRep(str)
{
	var re = !MZ && NC && Version<5 ? '[-(\\w) ([^]]+)\\]' : '\\[-(\\w) ([^\\]]+)\\]'
	return str.replace(new RegExp(re, 'g'),'PriFunc("$1","$2")')
}

function PriFunc(f,name)
{
	switch (f)
	{
		case 'e': f = (fexists(name),!IOResult);break
		case 'z': f = !fsize(name); break
		case 'f':
		case 'd':
		case 'w':
		case 'x':
		case 'r': var r = faccess(name)
			  if (IOResult) f = false; else
			  f = f=='f' && r.nm('d') || r.m(f)
			  break
		default: f = true
	}
	IOResult = 0
	return f
}

// Вычисляет разницу между двумя дирами
function SubcDirs(p1,p2)
{
	p1 = FullPath(p1).snsplit("/")
	p2 = FullPath(p2).snsplit("/")

	for (var i = 0; i<Math.min(p1.length,p2.length); i++)
	if (p1[i]!=p2[i]) break

	p2 = p2.slice(i).join("/")
	for (i++; i<p1.length; i++)
	p2 = "../"+p2

	return p2
}

// Для подстановки маски в скобки
function AddMask(str)
{
	if (/^\((.+)\)$/.test(str)) str = RegExp.$1

	var F, Str = str.snsplit(), Out = new Array(), add
	delete str

	for (i = 0; i<Str.length; i++)
	if (CheckMask(Str[i]))
	{
         	F =   SearchMask(Str[i])

		if (F.length)
		{
			add = SubcDirs(WD,ExtractPath(F[i]))
			for (j in F) F[j] = add+ExtractName(F[j])
		}

		Out = Out.concat(F)
	} else
	Out = Out.concat(Str.slice(i,i+1))

	return StripSlashes('('+Out.join(' ')+')')
}

// Убирает все экранирующие слеши
function StripSlashes(str)
{
	return str.replace(/\\(.)/g,"$1")
}

// "Защищенный" (для IE5) eval
function sheval(expr)
{
	IOResult = errNoError
	if (OP || MZ || IE && Version > 4)
	expr = 'try {\n\texpr = ' + expr + '\n} catch(e) {\n\tfappend("/core.dump","' +
	expr.replace(/"/g, '\\"') +
	' -> sheval ->\\n")\n\tIOResult = errEvalError\n'+
	"\tfappend('/core.dump',(expr = e.description)+'\\n\\n')\n}"

	return eval(expr)
}

// Применение маски файла и FullName на массив (без 1st эл-та)
function DoName(arr)
{
	var out = new Array(), k = 0

	for (i = 1; i<arr.length; i++)
	if (arr[i]=="-")
	out = out.concat("-"); else
	out = out.concat(SearchMask(FullName(arr[i])))

	for (i in out) out[i] = StripSlashes(out[i])

	if (arr.length>1 && arr[1]!="") return out; else
	return new Array("")
}

// Для команды cd
function prepcd(str)
{
	if (faccess(str).nm('x')) return "cd: "+ErrorMsg(IOResult = errNoAccess)
	var Path = SearchMask(FullPath(str))
	if (Path.length>0) SetVar('pwd',WD=Path[0])
	return ''
}

// Срезает пробелы слева
function ltrim(str)
{
	if (/^\s*(\S.{0,})$/.test(str)) return RegExp.$1
	return str
}

// Разбор адреса for sed
function CheckAddress(line,num,com,len)
{
	var flag;
	if (/^(\d+),(\d+)(!?)(.{0,})/.test(com))
	{
		flag=((num>=RegExp.$1) && (num<=RegExp.$2));
		if (RegExp.$3=='!') flag=!flag;
		if (flag) return RegExp.$4;
		return false;
	} else
	if (/^(\d+)(!?)(.{0,})/.test(com))
	{
		flag=(num==RegExp.$1);
		if (RegExp.$2=='!') flag=!flag;
		if (flag) return RegExp.$3;
		return false;
	} else
	if (/^\/([^\/]+)\/(!?)(.{0,})/.test(com))
	{
		var res=RegExp.$3;
		var reg=new RegExp(RegExp.$1);
		var inv=RegExp.$2;
		flag=(reg.test(line));
		if (inv=='!') flag=!flag;
		if (flag) return res;
		return false;
	} else
	if (/^\$(!?)(.{0,})/.test(com))
	{
		flag=(num==len);
		if (RegExp.$1=='!') flag=!flag;
		if (flag) return RegExp.$2;
		return false;
	} else return com;
};

// Замена спецсимволов (до пробела) на \HH

function Spec2Hex(str)
{
	if (!/\W/.test(str)) return str;
	var c;
	for (var i=0,out='';i<str.length;i++)
	if ((str.c(i)!='\n') && (str.c(i)<' '))
	out+='\\'+escape(str.c(i)).substr(1);
	else out+=str.c(i);
	return out;
};

// Экранировка для reg exp
function QuoteMeta(str)
{
	for (var out="",i=0;i<str.length;i++)
	{
		if (/[\^\\\/\.\+\*\?\[\]\(\$\)\|]/.test(str.c(i))) out+="\\"
		out+=str.c(i)
	}
	return out
};

// Экранировка для path
function QuoteMeta2(str)
{
	for (var out="",i=0;i<str.length;i++)
	{
		if (/[>< \*\?\[\]]/.test(str.c(i))) out+="\\"
		out+=str.c(i)
	}
	return out
}

// Экранировка Unix spec chars
function QuoteMeta3(str)
{
	for (var out="",i=0;i<str.length;i++)
	{
		if (/[>< \$\*`\?\[\]]/.test(str.c(i))) out+="\\"
		out+=str.c(i)
	}
	return out
}

// Sed
function Sed(line,Script,lineout)
{
	var Lines=line.split("\n"),buffer='',res,out='',c,str,i,j;
	var addon='';		// Добавка после буфера (для r)
	var XpaH='';		// Хранилище
	var newfor=0,chg=0,brack=0,addr='';
	line=null;
	var len=Lines.length, scln
	for (i=0;i<len-1;i++) Lines[i]=Lines[i]+'\n';
	for (i=0;i<Script.length;i++)		// 3aмена { на адреса
	{
		scln = StripSlashes(Script[i])
		if (brack)
		{
			if (/^([^\}]*)\}/.test(scln))
			brack=0,Script[i]=addr+RegExp.$1; else
			scln = addr+scln;
		} else
		if (/^([^\{]*)\{([^\}]*)/.test(Script[i]))
		brack=1,scln = (addr=RegExp.$1)+RegExp.$2;
		Script[i] = scln
	};
	for (i=0;i<len;i++)
	{
		newfor=0;
		buffer=Lines[i];
		for (j=0;j<Script.length;j++)
		{
			res=CheckAddress(buffer,i+1,Script[j],len);
			if (res)
			{
				str=res.substr(1);
				switch (c=res.c(0))
				{
					case 'a': out+=str+'\n';break;
					case 'd': buffer='';newfor=1;break;
					case '=': out+=(i+1)+'\n';break;
					case 'x': var temp=XpaH;
						  XpaH=buffer;
						  buffer=XpaH;chg=1;break;
					case ':': break;
					case 'q': return Spec2Hex(out);
					case 'p': out+=buffer;break;
					case 'P': var p=str.indexOf('\n');
						  if (p<0) p=str.length-1;
						  out+=buffer.substring(0,p);break;
					case 'N': buffer+=Lines[++i];chg=1;break;
					case 'n': out+=buffer;buffer=Lines[i+1];chg=1;
						  break;
					case 'l': for (var k=0;k<buffer.length;k++)
						  if ((buffer.c(k)!='\n') && (buffer.c(k)<' '))
						  out+='Got '+buffer.charCodeAt(k)+'\n';
						  else out+=buffer.c(k);
						  break;
					case 'D': var p=str.indexOf('\n');
						  if (p<0) p=str.length-1;
						  buffer=buffer.substr(p+1);chg=1;
						  break;
					case 'g': buffer=XpaH;chg=1;break;
					case 'G': buffer+=XpaH;chg=1;break;
					case 'h': XpaH=buffer;break;
					case 'H': XpaH+=buffer;break;
					case 'i': out+=str+'\n';break;
					case 'c': if (/^\d+,(\d+)/.test(Script[j]))
						  {
						  	if ((i+1)==RegExp.$1)
							buffer='',out+=str+'\n',
							newfor=1;
						  } else
						  buffer='',out+=str+'\n',newfor=1;
						  break;
					case 't': if (!chg) break;chg=0;
					case 'b': str=':'+str;
						  for (;j<Script.length;j++)
						  if (str==Script[j]) break;
						  break;
					case 's': if (/^\/([^\/]+)\/([^\/]*)\/([^\/]*)/.test(str))
						  {
							var fr=RegExp.$1;
							var to=RegExp.$2;
							var fl=RegExp.$3;
							if (fl.m('g'))
							var reg=new RegExp(fr,"g"); else
							var reg=new RegExp(fr);
							var be=reg.test(buffer);
							buffer=buffer.replace(reg,to);
							if (be)
							{
								if (fl.m('p'))
								out+=buffer;
								if (fl.m('w'))
								fappend(Script[++j],buffer);
								chg=1;
							};
						  };break;
					case 'r': var res = fget(FullName(Script[++j]));
						  if (!IOResult) addon=res+'\n';
						  break;
					case 'w': fappend(Script[++j],buffer);break;
					case 'y': if (/^\/([^\/]+)\/([^\/]+)\//.test(str))
						  {
							var fr=RegExp.$1, to=RegExp.$2, ch
							for (var k=0;k<Math.min(fr.length,to.length);k++)
							{
								if (!chg)
								if (buffer.m(fr.c(k))) chg=1;
								var reg = new RegExp(QuoteMeta(fr.c(k)),"g");
								buffer=buffer.replace(reg,to.c(k));
							};
						  };break;
				};
			};    
			if (newfor) {newfor=0;break};
		};
		out+=(lineout?buffer:'')+addon;
		addon='';
	};
	return Spec2Hex(out);
};

// Поставить в очередь команд
function SetChain(com)
{
	for (var i = 128; i<148; i++)
	if (PIDs.find(i)<0) break
	if (i == 148) return ""

	Chain.push(com)
	PIDs.push(i)

	if (pHnd == null) pHnd=setInterval("BackExec()",1000)
	return i
};

// Фоновое выполнение
function BackExec()
{
	var last = Chain.length - 1, cur, com

	if (last>=0)
	{
		daemoncnt++
		chaincnt++

		var max = last?Math.floor(6/last):12
		if (max<2) max = 2
		if (daemoncnt>max)
		{
			daemoncnt = 0
			if (last<daemoncur || daemoncur<0) daemoncur = last

			for (; daemoncur>=0; daemoncur--)
			if (/daemon/.test(com = Chain[daemoncur])) break
			if (daemoncur>=0) PID = PIDs[daemoncur],Exec(com),PID = 0
			daemoncur--
		}

		if (chaincnt>2)
		{
			chaincnt = 0
			for (cur = last; cur>=0; cur--)
			if (!/daemon/.test(com = Chain[cur])) break
			if (cur>=0)
			{
				PID = PIDs[cur]
				Chain.del(cur)
				PIDs.del(cur)
				Exec(com)
				PID = 0
			}
		}
	} else
	{
		daemoncnt = chaincnt = 0
		if (pHnd!=null) clearInterval(pHnd)
		pHnd = null
	}
};

// Установить переменную
function SetVar(name,val)
{
	IOResult = errNoError
	if (name.charAt(0)=='$') name=name.substring(1)
	if (name.length>1 && /[- ]/.test(name)) return IOResult = errInvSyntax

	if (VarNames.length!=VarValues.length) {EL(255);return ''};
	for (var i=0;i<VarNames.length;i++)
	if (VarNames[i]==name) break;
	VarNames[i]=name;
	VarValues[i]=val;
	return '';
};

// Ищет символ с которого cтроки расходятся (не совпадают)
// Длина 1st строки должна быть >= второй
function Compare(s1,s2)
{
	if (s1.length<s2.length) return 0;
	for (var i=0;i<s2.length;i++)
	if (s1.c(i)!=s2.c(i)) break;
	return i;
};

// Взять настоящее значение переменной
function GetRealVar(name)
{
	IOResult = errNoError;
	for (i=0;i<VarNames.length;i++)
	if (VarNames[i]==name) return VarValues[i]
	return IOResult = errVarNotFound;
};

// Взять значение переменной с учетом всяких #, [] и проч.
function GetVar(name)
{
	var r,i,Vals
	IOResult = errNoError
	if (/^#(.+)/.test(name))
	{
		Vals = GetRealVar(RegExp.$1)
		if (IOResult) return IOResult;
		return Vals=="()"?0:Vals.split(' ').length
	}

	if (/^%(.+)/.test(name))
	return '"'+GetVar(RegExp.$1.replace(/"/g,'\\"'))+'"'

	if (/^\?(.+)/.test(name))
	return GetRealVar(RegExp.$1),r = IOResult,IOResult = errNoError,r?0:1

	if (/^(\d+)(.{0,})/.test(name))
	{
		r = RegExp.$2
		if (!parseInt(RegExp.$1)) return scriptname+r;
		Vals = GetVar("argv["+RegExp.$1+"]")
		if (IOResult) return IOResult = errNoError,r
		return Vals+r
	}

	if (/^\*(.{0,})/.test(name))
	return r = RegExp.$1,GetVar("argv[*]")+r

	// для NC слеши перед [ & ] убраны, для NC 5.xx, 6.xx - поставлены
	// специально для beonex и ранних мозил стоит {0,} вместо *

	if (!MZ && NC && Version < 5)
	var ts = new RegExp("^([^[]+)\\[([^]]+)\\](.{0,})").test(name); else
	var ts = /^([^\[]+)\[([^\]]+)\](.{0,})/.test(name)

	if (ts)
	{
		r = RegExp.$3
		i = RegExp.$2.split(",")

		Vals = GetRealVar(RegExp.$1)

		if (IOResult) return IOResult
		if (i.length<2 || i[1] == "") i[1] = 1
		if (i.length<3 || i[2] == "") i[2] = Vals.length+1

		if (/^\((.*)\)$/.test(Vals))
		Vals = RegExp.$1.split(' ')
		else Vals = new Array(Vals+'')

		if (i[0] == "*" || i[0] == "") return Vals.join(' ').substring(i[1]-1,i[2]-1)

		if (i[0]>Vals.length || i[0]<=0 || Vals=="") return IOResult = errOutOfBounds
		return Vals[i[0]-1].substring(i[1]-1,i[2]-1)
	};

	if (name.m('[')) return IOResult = errInvIndex;

	switch(name)
	{
		case "*": return GetVar("argv[*]")
		case "#": return GetVar("#argv")
		case '-': return '';
		case '$': return PID
	};
	return GetRealVar(name);
};


// Возвращает значение переменной, если $?переменная, иначе - ''
function GetRealVar2(str)
{
	if (str = GetRealVar(str),IOResult) return ''
	return str
}

// Hайти переменную, max. соотв. имени+остаток
function SearchVar(name)
{
	var max=0,i,p,idx;
	if (VarNames.length!=VarValues.length) {EL(255);return ''};

	for (i=0;i<VarNames.length;i++)
	{
		p=Compare(name,'$'+VarNames[i]);
		if (p>max) max=p,idx=i;
	};
	if (max<2) return '';
	return VarValues[idx]+name.substring(VarNames[idx].length+1);
};

// Пытается заменить все переменные на их значения
// (рассматривается часть строки после '=' )
function ReplaceAllVars()
{
	IOResult = errNoError
	str = arguments[0]
	if (/^(\$?\w+=)(.+)/.test(str))
	var out = RegExp.$1,str = RegExp.$2; else var out = ""
	var idx,i, name

	while ((idx = str.indexOf("$"))>=0)
	{
		if (idx>0 && str.c(idx-1) == "\\")
		out+= str.substring(0,idx-1)+'$',
		str = str.substr(idx+1); else
		{
			out+= str.substring(0,idx)
			str = str.substring(idx+1)

			if (
			/^([\w_][_\w\d]*\[[\d\*,]+\]?)(.{0,65535})$/.test(str) ||
			/^([_\w\d\{\}]+)(.{0,65535})$/.test(str) ||
			/^([#\?][_\w\d]+)(.{0,65535})$/.test(str) ||
			/^(%\*)(.{0,65535})$/.test(str) ||
			/^(%\d+)(.{0,65535})$/.test(str) ||
			/^(\d+)(.{0,65535})$/.test(str) ||
			/^([\*\$#-])(.{0,65535})$/.test(str))
			name = RegExp.$1, str = RegExp.$2;  else
			name = str, str = ""

			if (/^\{(.*)\}(.{0,65535})$/.test(name))
			name = RegExp.$1, str = RegExp.$2+str

			out+= GetVar(name)
		}
	}
	return out+str
};

// Аналог :N в TPascal'e
function Norm(str,n)
{
	str+='';
	var l=str.length;
	for (var i=l;i<=n;i++) str=' '+str;
	return str;
};

// Аналог :N в TPascal'e, но с другого края
function Norm2(str,n)
{
	str+='';
	var l=str.length;
	for (var i=l;i<=n;i++) str=str+' ';
	return str;
};

// Урезка строки
function CutStr(str,n)
{
	if (str.length<=n) return str;
	return str.substr(0,n-3)+"...";
};

// Поиск [не]совпадений
function Grep(s, r, flag, case_ins)
{
	var str=s.split(/\n/), out='', s
	if (case_ins) r = r.toLowerCase()

	/*@cc_on
	@if (@_jscript_version>4)
	try
	{@end @*/
		var reg=new RegExp(r)
	/*@cc_on
	@if (@_jscript_version>4)
	}
	catch (e)
	{
		return ""
	};
	@end
	@cc_off @*/

	for (var i=0;i<str.length;i++)
	{
		s = case_ins ? str[i].toLowerCase() : str[i]

		if (flag && !reg.test(s) || !flag && reg.test(s))
		{
			if (out!='') out+= '\n'
			out+= str[i]
		}
	}

	return out
}

// Выделяет столбец

function Cut(s,r,lf)
{
	var ro=r.split(','),i,j,xx,z=0,fm,to
	var Nu=new Array()
	for (i=0;i<ro.length;i++)
	{
		xx=ro[i].split('-')
		if (xx.length==1) Nu[z++]=parseInt(xx[0]);else
		{
			fr=parseInt(xx[0])
			to=parseInt(xx[1])
			if (!((isNaN(fr)) || (isNaN(to)) || (fr>to)))
			for (;fr<=to;fr++) Nu[z++]=fr
		};
	};
	var str=s.split(/\n/), Line, out = ''
	for (i=0;i<str.length;i++)
	{
		Line = str[i].split(/\s+/)
		if (out.length) out+= lf
		for (z = 0; z<Nu.length; z++)
		if (Nu[z]-1<Line.length)
		{
			if (out!='' && z) out+= ' '
			out+= Line[Nu[z]-1]
		}
	}
	return out
};

// Устанавливает код завершения команды

function EL(s)
{
	errorlevel=s;return '';
};


// производит подмену подстановки `комманда` результатом комманды

function ReplaceW(str)
{
	IOResult = errNoError
	var out = "", idx, flag = 0
	while ((idx = str.indexOf("`"))>=0)
	{
		if (idx>0 && str.c(idx-1)=="\\")
		out+= str.substring(0,idx-1)+"`",
		str = str.substr(idx+1); else
		{
			if (flag)
			out+= Exec(str.substring(0,idx)),
			str = str.substr(idx+1),flag = 0; else
			out+= str.substring(0,idx),
			str = str.substr(idx+1),flag = 1
		}
		
	}
	return out+str
};

// Пытается угадать какие права доступа должны быть у файла
function GuessAccess(i)
{
	if (typeof(Files[i])=="undefined") return "-rw-"
	var con = Files[i].substr(0,2)
	if (con=="\n>") return "lrw-"
	if (con=="#/")  return "-rwx"
	if (typeof(Names[i])!="undefined" && Names[i].m("/bin/") && Files[i].length<501)
	return "-rwx"

	return "-rw-"
}


// Производит исправление файловой системы
function RubScan()
{
	EL(0);
	var err=0,i,j,item,out='';

	if (typeof(Access)=="undefined" || typeof(Access.length)=="undefined" || typeof(Access.constructor)=="undefined" || (Access.constructor+"").nm("Array")) Write("\nAccess table corrupted. Droped."),err++,Access = new Array()
	if (typeof(Names)=="undefined" || typeof(Names.length)=="undefined" || typeof(Names.constructor)=="undefined" || (Names.constructor+"").nm("Array"))   Write("\nNames table corrupted. Droped."),err++,Names  = new Array()
	if (typeof(Files)=="undefined" || typeof(Files.length)=="undefined" || typeof(Files.constructor)=="undefined" || (Files.constructor+"").nm("Array"))   Write("\nFiles table corrupted. Droped."),err++,Files  = new Array()

	for (i=0;i<Files.length;i++)
	{
		if (typeof(Files[i])=="undefined")
		Files[i]='<added by scan>'+i,err++,Write('\nFiles table corrupted. Corrected.')
	};

	for (i=0;i<Access.length;i++)
	{
		if (typeof(Access[i])=="undefined")
		Access[i] = GuessAccess(i),err++,Write('\nAccess table corrupted. Corrected.')
	};

	for (i=0;i<Names.length;i++)
	{
		if (typeof(Names[i])=="undefined")
		Names[i]='/undefined',err++,Write('\nNames table corrupted. Corrected.')
	};


	var max = Math.max(Math.max(Access.length,Files.length),Names.length)
	if (Files.length<max)
	{
		err++;
		Write('\nFiles table corrupted. Corrected.');
		for (i = Files.length-1;i<max;i++) Files[i]='<added by scan>'
	};
	if (Access.length<max)
	{
		err++;
		Write('\nAccess table corrupted. Corrected.');
		for (i = Access.length-1;i<max;i++) Access[i] = GuessAccess(i)
	};
	if (Names.length<max)
	{
		err++;
		Write('\nNames table corrupted. Corrected.');
		for (i = Names.length-1;i<max;i++) Names[i]=UniqFile()
	};
	for (var r,p,i = 0;i<Access.length;i++)
	{
		r = ""
		for (var j=0; j<Access[i].length; j++)
		{
			p=Access[i].c(j)
			switch (p)
			{
				case 'p':
				case 'b':
				case 'c':
				case 'e':
				case 'l': if (j==0) r+=p; else r+='-';break;
				case 'r': if (j==1) r+=p; else r+='-';break;
				case 'w': if (j==2) r+=p; else r+='-';break;
				case 'T':
				case 'x': if (j==3) r+=p; else r+='-';break;
				default : r+='-';
			};
		};
		for (;j<4;j++) r+='-';
		if (Access[i]!=r) Write('\nFiles '+Names[i]+' had wrong access rights.'),err++;
		Access[i]=r;
	};
	for (i=0;i<Names.length;i++)
	{
		var name=Names[i];
		if (name=='') name=UniqFile();
		if (name.c(0)!='/') name='/'+name;
		Names[i]=name;
		if ((Access[i].c(0)=='l') && (Files[i].substr(0,2)=='\n>'))
		{
			fexists(Files[i].substr(2));
			if (IOResult)
			Write('\nLink to unexists file. Corrected.'),err++,
			Names = DeleteItem(Names,i),
			Files = DeleteItem(Files,i),
			Access = DeleteItem(Access,i)
		};
		
		for (j=0;j<Names.length;j++) if (i!=j)
		{
			if (Names[j]==Names[i])
			Write('\nDublicate filename '+Names[i]+' corrected.'),
			err++,Names[i]=ExtractPath(Names[i])+UniqFile();
		};
	};
	return '\nCorrected '+err+' error(s).';
};

function Run()
{
	// Почему-то передача параметров в IE 4.01 глючит...
	var str = ltrim(arguments[0]), bustr = ltrim(arguments[1]), nstr = str,i,
	sline = arguments[2]

	if ((str==' ') || (str=='') || (str=='{') || (str=='}')) return '';
	str = str.replace(/\\t/g,"        ").replace(/\\n/g,"\n")
	// Если образуется петля, выход из петли.
	if (TTL<0) {TTL = 20;return str+': Loop found. Terminated.'}

	// Разделение аргументов
	var args=str.snsplit(),com = ltrim(args[0]),out='',i,Mask
	if (args.length<1) return ""

	// Вырезаем ключи
	var key = ""
	if (com != 'chmod')
	for (i = 0; i<args.length; i++)
	if (args[i].c(0)=="-" && args[i].length>1)
	{
		key+= args[i]+" "
		args = DeleteItem(args,i)
		i--
	}
	var cnt=args.length-1;

	// В переменной parms находятся все аргументы
	var parms=args.slice(1,cnt+1).join(' ')

	// Обработка алиасов. Должна стоять первой, что бы можно
	// было назначить алиасы встроенным командам
	if (com=='alias' || com=='unalias')
	{
		var name = "/etc/alias.cf"
		if (fexists(name),!IOResult)
		{
			out = fget(name)
			if (IOResult) return ErrorMsg(IOResult)
		} else out = ""
		out = out.split("\n")

		if (com == 'alias')
		{
			if (cnt>1)
			{
				if (out.length>1)
				{
					for (i = 0; i<out.length; i+=2)
					if (out[i] == args[1]) break
				} else i = 0

				out[i]  = args[1]
				out[i+1]= StripSlashes(args[2])

				out = out.join("\n")
				fput (name,out)
				if (IOResult) return ErrorMsg(IOResult)
			} else
			if (cnt == 1)
			{
				for (i = 0; i<out.length; i+=2)
				if (out[i]==args[1])
				return Norm2(out[i],8)+" = "+out[i+1]
			} else
			{
				if (out.length>1)
				{
					str = ""
					for (i = 0; i<out.length; i+=2)
					str+= Norm2(out[i],8)+" = "+out[i+1]+"\n"
					return str
				}
			}
		} else
		{
			var reg
			if (!cnt) {EL(3);return 'Missing argument.'}
			for (j = 1;j<=cnt;j++)
			{
				reg = new RegExp("^"+args[j].replace(/\./g,"\\.").replace(/\?/g,".").replace(/\*/g,".*"))
				for (i = 0; i<out.length; i+=2)
				if (reg.test(out[i]))
				{
					out = DeleteItem(out,i+1)
					out = DeleteItem(out,i)
					i-=2
				}
			}
			if (out.length)
			fput (name, out.join("\n")); else
			fdelete (name)
			if (IOResult) return ErrorMsg(IOResult)
		}
		return ""
	} else
	if (com!=alias)
	{
		out = fget("/etc/alias.cf")
		if (!IOResult)
		{
			out = out.split("\n")
			for (i = 0; i<out.length; i+=2)
			if (out[i] == com)
			{
				alias = com
				if ((j = str.indexOf(" "))>=0)
				str = str.substr(j); else str = ""
				str = Exec(out[i+1]+str)
				alias = ""
				return str
			}
		}
		out = ""
	}
	IOResult = errNoError
	if (/^[^=]+=.{0,}$/.test(com))
	{

		EL(IOResult = 0)
		if (/^([^=]+)=(.{0,})$/.test(str))
		SetVar(RegExp.$1,RegExp.$2)
		else return Exec(Vars[i])
		if (IOResult) return ErrorMsg(IOResult)
		return ''
	} else
	if (com.c(0)=='#')
	{
		if (/^#(VB|JS):/i.test(com))
		{
			parms=parms.replace(/\slt\s/g,"<").replace(/\sgt\s/g,">").replace(/\sand\s/g,"&&").replace(/\sor\s/g,"||")
			/*@cc_on
			@if (@_jscript_version>4)
			try
			{@end @*/
				if (/^#VB:/i.test(com))
				{
					if (NC) return ""
					out=execScript(parms,'VBScript')
				} else
				out=eval(parms)
			/*@if (@_jscript_version>4)
			} catch (e) {return e.description}
			@end
			@cc_off @*/
			return out

		} else return ""
	} else
	if (com=='clear' || com=='c') return Clear(),''; else
	if (com=='restart')
	{
		if (IE)
		document.execCommand('refresh'); else
		location=location
		return ''
	} else
	if (com=='id')
	{
		return "uid=0("+login+")"
	} else
	if (com=='uname')
	{
		if (key.m('a')) key = "snrvm"
		if (key=="" || key.m('s')) out = "JUnix "
		if (key.m('n')) out+="localhost "
		if (key.m('r')) out+=Ver+" "
		if (key.m('v')) out+="#"+document.lastModified+" "
		if (key.m('m'))	out+="Browser: "+(IE?"IE":(MZ?'MOZ':"NC"))+" "+Version+" "
		return out
	} else
	if (com=='?')
	{
		EL(0)
		var Man = fget ('/bin/manual'), line = ""
		if (IOResult)
		if (fexists ('/bin/manual.jz'),!IOResult)
		var Man = Run  ('jzip -d /bin/manual.jz'); else
		return 'manual: '+ErrorMsg(IOResult)
		Man = Man.split(/\n/).sort()

		for (i=0;i<Man.length;i++)
		out+=Man[i].substr(0,Man[i].indexOf(' ')+1)
		return out
	} else
	if (com=='bye')
	{
		EL(0);
		st = UserStd;Type('Login: ')
		return ""
	} else
	if (com=='echo')
	{
		EL(0)
		str = str.replace(/^echo ?/,"")
		var nstr = AddMask(str)
		if (str!=nstr) nstr = nstr.slice(1,-1)
		return nstr+"\n"
	} else
	if (com=='cat')
	{
		EL(0)
		Mask = DoName(args)
		for (i = 0; i<Mask.length; i++)
		{
			if (fexists(Mask[i]),IOResult) out+=ErrorMsg(IOResult)+'\n',EL(IOResult); else
			{
				var cont = fget(Mask[i])
				if (IOResult) out+=ErrorMsg(IOResult)+'\n',EL(IOResult); else
				{
					if (out!='') out+= '\n'
					out+= cont
				}
			}
		}
		return out		
	} else
	if (com=='tee')
	{
		if (cnt<1) return EL(3),"Missing argument."
		var str = fget("")
		if (key.m("a") && fexists(args[1] = FullName(args[1])))
		fappend(args[1],str); else
		fput(args[1],str)
		if (IOResult) return EL(IOResult),ErrorMsg(IOResult)
		return str
	} else
	if (com=='wish')
	{
		if (cnt<1) return EL(3),"Missing argument."
		if (navigator.platform=="Win32" && location.protocol=="file:")
		{
			if (!cnt) return EL(7),"Invalid argument."

			if (fexists(args[1]=FullName(args[1])),IOResult) return ErrorMsg(IOResult)

			var res = MountExists(args[1])
			if (IOResult)
			return "File system must be VFAT."

			var Res = Device[res].split(',')
			args[1] = args[1].substr(Mount[res].length)
			for (i in args) args[i] = StripSlashes(args[i])
			/*@cc_on
			@if (@_jscript_version>4)
			try
			{@end @*/
				var shell = new ActiveXObject("WScript.Shell")
				shell.Run('"'+(Res[1]+"/"+args[1]).replace(/\//g,"\\")+'"'+args.slice(2).join(" "))
			/*@if (@_jscript_version>4)
			} catch (e) {return e.description};
			@end
			@cc_off @*/
			return "Application started."
		}
		return "Cannot start W-Shell"
	} else
	if (com=='break')
	{
		if (Break.length)
		return Break.rep(1),""; else
		return com+': Not in while/foreach.';
	}
	else 
	if (com=='continue')
	{
		if (Break.length)
		return Break.rep(2),""; else
		return com+': Not in while/foreach.';
	}
	else
	if (com=='source')
	{
		if (!cnt) return EL(IOResult = errFewArguments), ErrorMsg(IOResult)
		Mask = DoName(args)
		EL(0)
		for (i = 0; i<Mask.length; i++)
		{
			var res = fget(Mask[i])
			if (IOResult) out+= ErrorMsg(IOResult)+'', EL(IOResult); else
			out+=Exec(res)
		}
		return out		
	} else
	if (com=='date')
	{
		out = (cnt && args[1].c(0)=="+")?parms.substr(1):"%a %h %d %T WDT %f"
		var d = new Date()
		var year = d.getYear(), fy = year
		if (year>=2000) year-=2000; else
		{
			fy+=1900
			if (year>=100)  year-=100
		}

		var r = Math.ceil((d.getTime() - (new Date(fy,0,1,0,0,0)).getTime())/86400000)

		if (/^(\S+)\s+(\S+)/.test(d+""))
		var day = RegExp.$1, mon = RegExp.$2; else
		var day = "", mon = ""

		out = out.replace(/%D/g,"%m/%d/%y").replace(/%T/g,"%H:%M:%S")
		out = out.replace(/%%/g,"%").replace(/%n/g,"\n").replace(/%t/g,"\t")
		out = out.replace(/%m/g,(1+d.getMonth()+"").lz(2)).replace(/%d/g,(""+d.getDate()).lz(2))
		out = out.replace(/%y/g,(year+"").lz(2)).replace(/%H/g,(""+d.getHours()).lz(2))
		out = out.replace(/%M/g,(d.getMinutes()+"").lz(2)).replace(/%S/g,(""+d.getSeconds()).lz(2))
		out = out.replace(/%r/g,(d.getHours()%13+"").lz(2)).replace(/%w/g,(d.getDay()+""))
		out = out.replace(/%h/g,mon).replace(/%a/g,day).replace(/%f/g,fy).replace(/%j/g,r)
		return out

	} else
	if (com=='dialog')
	{
		// Слеши перед [ и ] для старого NC убраны - он их не понимает

		if (!MZ && NC && Version < 5)
		var ts = new RegExp("\\[([^])]*)\\]\s+\[([^]]+)\\]").test(parms); else
		var ts = /\[([^\])]*)\]\s+\[([^\]]+)\]/.test(parms)

		if (ts)
		{
			var pipe
			prompt = RegExp.$1, dlgcom = RegExp.$2

			if (pipefile != "")
			{
				dialog = 0
				if (/([^\n]*)\n(.+)/.test(pipefile))
				pipe = RegExp.$1, pipefile = RegExp.$2; else
				pipe = pipefile,  pipefile = ""

				out = Exec(DialogRep(dlgcom,pipe))
				if (pipefile == "") dialog = 0, dlgcom
				return out
			}

			dialog = 1
			return ''
		}
		EL(3)
		return 'Missing argument.'
	} else
	if (com=='grep')
	{
		EL(0)
		var Pat=args[1]
		Mask = DoName(args.slice(1))
		if (cnt<1) {EL(3);return 'Missing argument.'}
		for (i = 0; i<Mask.length; i++)
		{
			var r = fget(Mask[i])
			if (IOResult) EL(IOResult),
			r = (key.m('s')?'':ErrorMsg(IOResult)); else
			{
				var case_ins = (key.m('y')) || (key.indexOf('i')>=0)
				r = Grep(r, Pat, key.m('v'), case_ins)
				if ((key.m('h')) && (r!='')) r='\n'+Mask[i]+'\n'+r
				if ((key.m('l')) && (r!='')) r='\n'+Mask[i]
				if (key.m('c'))
				{
					if (r=='') r=0; else
					r=r.split(/\n/).length
				}
				out+=r
			}
		}
		return out
	} else
	if (com=='compress' || com=='jzip')
	{
		var flag=key.m('d')
		var pack=com=='jzip'
		var jbou = key.m('l') ? 4 : 3;

		Mask=DoName(args);
		for (i = 0; i<Mask.length; i++)
		{
			var r = fget(Mask[i])
			if (IOResult) out+='\n'+ErrorMsg(IOResult),EL(IOResult); else
			{
				if (pack)
				out+= flag?UnJZip(r,0):JZip(r,0,jbou); else
				out+= flag?RLEDecompress(r):RLECompress(r)
			}
		}
		return out
		
	} else
	if (com=='cd')
	{
		EL(0)
		var pwd

		if (!cnt)
		{
			var pwd = GetRealVar('home')
			if (IOResult) return ErrorMsg(IOResult = errNoHome)
			return prepcd(pwd)
		}
		args[1] = StripSlashes(args[1])
		var acc = faccess(args[1])
		if (acc!=-1 && acc.c(0)=="l")	// Нет проверки на сущ., цел. кат. м/не сущ.
		{
			i = LocalExists(FullName(args[1]))
			if (IOResult) return ''
			args[1] = Files[i].substr(2)
		}
		if (fexists(pwd = FullPath(args[1])),!IOResult) return prepcd(pwd)

		pwd = GetVar("cdpath[*]")
		if (!IOResult)
		{
			var Cdpath = pwd.split(" ")
			for (i in Cdpath)
			{
				pwd = StripSlashes(FullPath(Cdpath[i])+parms)
				if (fexists(pwd),!IOResult)
				return prepcd(pwd)

			}
		}

		if (parms.nm(' ') && (pwd = GetRealVar(args[1]),!IOResult) && pwd.c(0)=="/")
		return prepcd(pwd)
		
		return ErrorMsg(IOResult=errNotFound)
	} else
	if (com=='-')
	{
		if ((out = fget(""))=="") out = minus; else
		minus = out, out = ""
		return out
	} else
	if (com=='ls' || com=='ll')
	{		
		if (com=='ll') key = 'la'
		EL(0)
		var wd,name,j=0,res,acc
		if (key.m('f'))
		{
			if (!cnt) {EL(3);return '\nMissing arguments.'};
			wd=ExtractPath(FullName(args[1])),key='-a';
		}
		else
		if (cnt>=1) wd=FullPath(args[1]); else wd=WD
		var Dirs=SearchMask(wd)

		var Fl1=((key.m('o')) || (key.m('g')));
		var Fl2=((Fl1) || (key.m('l')));
		var Fl3=key.m('a');
		var Fl4=key.m('1');
		var user = ' '+Norm(login,9);
		for (k=0;k<Dirs.length;k++)
		{
			var List = flist(Dirs[k])
			if (!IOResult)
			for (i in List)
			if (Fl3 || List[i].c(0)!=".")
			{
				name = Dirs[k]+List[i]

				if (faccess(name).m('l') && (res = LocalExists(name),!IOResult))
				List[i] +=' -> '+Files[res].substr(2)

				acc = faccess(name)

				if (acc.nm('M'))
				if (Fl2) out+=acc+(!Fl1?user:'')+Norm(fsize(name),10)+' '+List[i]+'\n', j++; else
				out+=List[i]+(Fl4?'\n':' ');
			}
		}
		if (out=="" && key.m('l')) out = "total 0"
		return out
	} else
	if (com=='rmdir')
	{
		EL(0)
		if (cnt<1) {EL(3);return 'Missing argument.'}
		for (i = 1;i<=cnt;i++)
		{
			var Mask = SearchMask(FullPath(args[i]));
			for (j = 0;j<Mask.length;j++)
			{
				var dir = Mask[j]
				if (flist(dir).length) out+='\nDirectory '+dir+' is not empty.'; else
				if (fexists(dir),IOResult) out+='\n'+ErrorMsg(IOResult); else
				{
					if (dir.l()=="/") fdelete(dir.substr(0,dir.length-1))
					fdelete(dir)
				}
			}
		}
		return out
	} else
	if (com=='mkdir')
	{
		EL(0)
		if (cnt<1) {EL(3);return 'Missing argument.'}
		for (i = 1;i<=cnt;i++)
		{
			if (fexists(FullName(args[i])), !IOResult)
			out+=ErrorMsg(IOResult = errNoAccess)+'\n'; else
			fput(FullPath(args[i]),"-----",1)
		}
		return out
	} else
	if (com=='mkfifo')
	{
		var Mask = DoName(args)
		for (i = 0; i<Mask.length; i++)
		{
			fput(Mask[i],"")
			if ((j = LocalExists(Mask[i])), IOResult) out+="mkfifo: "+ExtractName(Mask[i])+": Cannot to create pipe.\n"; else
			Access[j] = "p"+Access[j].substr(1)
		}
		return out
	} else
	if (com=='scan' || com=='fsck') return RubScan(); else
	if (com=='chmod')
	{
		EL(0)
		if (cnt<1) {EL(3);return 'Missing argument.'}
		var r1 = new RegExp ("^\\d+$")		// Special for prevent
		var r2 = new RegExp ("^[-+rwx]+$")	// NC crash

		if (r1.test(args[1]) || r2.test(args[1]))
		{
			var Mask = DoName(args.slice(1)), res
			for (i=0;i<Mask.length;i++)
			{
				if (fexists(Mask[i]),IOResult) out+='\n'+ErrorMsg(IOResult); else
				{
					if (args[1].length==1)	// цифра
					{
						var arg = parseInt(args[1],'8')
						if (isNaN(arg)) {EL(7);return 'Invalid argument.'}

						res = fchmod (Mask[i], ((arg & 4)?'r':'-')+((arg & 2)?'w':'-')+((arg & 1)?'x':'-'))
					} else
					{
						var acc = faccess(Mask[i]).split(""), f = 1

						for (k=0;k<args[1].length;k++)
						{
							switch(args[1].c(k))
							{
								case '+': f = 1;break
								case '-': f = 0;break
								case 'r': acc[1] = f?'r':'-';break
								case 'w': acc[2] = f?'w':'-';break
								case 'x': acc[3] = f?'x':'-';break
							}
						}
						res = fchmod (Mask[i], acc.join(''))
					}
					if (res) out+='\n'+ErrorMsg(res)
				}
			}
			return out
		} else
		{
			var Mask = DoName(args)
			for (i = 0; i<Mask.length; i++)
			{
				var r = faccess(Mask[i])
				if (IOResult) EL(1), out+="File not found.\n"; else
				out+=((r.m('r'))?4:0)+((r.m('w'))?2:0)+((r.m('x'))?1:0)+"\n"
			}
			return out
		}
		return ""
	} else
	if (com=='cp' || com=='mv')
	{
		EL(0)
		if (!cnt) return EL(3),"Missing argument."
		var isdir = 0, last = cnt, cont, to, acc, res, name
		if (cnt == 1)
		{
			to = GetVar("pwd")
			if (IOResult) to = "/"
			last = cnt+1
			isdir = 1
		} else
		{
			cont = faccess(to = StripSlashes(args[cnt]))
			if (!IOResult && cont.c(0)=="d")
			to = FullPath(to), isdir = 1
		}
		if (CheckMask(to)) return EL(7),"Cannot do multiple copy."

		var Mask = DoName(args.slice(0,last))
		for (i = 0; i<Mask.length; i++)
		{
			var cont = faccess(Mask[i])
			if (!IOResult && cont.slice(1,2)=="rw")
			EL(errNoAccess),out+=com+": "+ErrorMsg(errNoAccess)+".\n"; else
			{
				cont = fget(Mask[i] = StripSlashes(Mask[i]))
				if (IOResult) out+=com+": "+ErrorMsg(IOResult)+"\n"; else
				{
					name = isdir?to+ExtractName(Mask[i]):to
					if (FullName(name) == FullName(Mask[i]))
					out+="Cannot copy the file onto itself.\n"; else
					{
						acc = faccess(Mask[i])
						fput(name,cont)
						if (IOResult) out+=com+": "+ErrorMsg(IOResult)+"\n"; else
						{
							res = LocalExists(name)
							if (!IOResult) Access[res] = "-"+acc.substr(1)
							delete cont
							if (com == "mv") fdelete(Mask[i])
						}
					}
				}
			}
		}
		return out

	} else
	if (com=='ln')
	{                  
		EL(0);
		if (cnt<2) {EL(3);return '\nMissing argument.'};
		var fr = FullName(args[1]);
		var to = FullName(args[2]);
		if (fexists(fr),IOResult) {EL(IOResult);return '\n'+ErrorMsg(IOResult)};
		if (fexists(to),IOResult) j = Names.length; else
		{
			j = LocalExists(to)
			if (IOResult || faccess(to).nm('w')) {EL(errNoAccess);return ErrorMsg(errNoAccess)};
		};
		Names[j] = to;
		Files[j] = '\n>'+fr;
		Access[j] = 'l---';
		return '';
		
	} else
	if (com=="endif" || com=="end" || com=="endsw" || com=="else") return '';else
	if (com=='repeat')
	{
		if (/^repeat\s+(\S+)\s+(.+)$/.test(str))
		{
			var n = parseInt(RegExp.$1),comstr = RegExp.$2
			if (isNaN(n)) return ErrorMsg(IOResult = errNoNumber)

			for (var i = 0; i<n; i++)
			out+=Exec(comstr)+'\n'
			return out
		} else
		return ErrorMsg(IOResult = errFewArguments)
	} else
	if (com=='rehash' || com=='unhash' || com=='jush' || com=='jssh' || com=='wait') return ""; else
	if (com=='if')
	{
		for (var br = 0, ch, i = 0; i<str.length; i++)
		if ((ch = str.c(i))==";") break; else
		if (ch=="(") br++; else
		if (ch==")")
		{
			if (--br<1) break
		}
		var thn = str.substr(i+2), exp = str.substr(0,i+1), rest
		if (/^ *then *;(.+)/.test(thn))
		{
			var coms = RegExp.$1
			if (!/^if\s+\((.*)\)\s*$/.test(exp)) return "if: Empty if."
			var expr = RegExp.$1, els = ""
			var Coms = coms.snsplit(";"), bound = new stack(), cur

			for (i = 0; i<Coms.length; i++)
			if (!bound.length && /^else(.{0,65535})/.test(Coms[i])) // "{0,65535}" for Beonex
			{
				els  = (RegExp.$1==""?"":RegExp.$1+";")+Coms.slice(i+1).join(";")
				coms = Coms.slice(0,i).join(";")
				break
			} else
			if (Coms[i]==bound.top()) bound.pop(); else
			if ((cur=ShellComs(Coms[i]))!="")
			bound.push(cur)

			delete Coms
			delete bound
		} else
		if (/^if\s+\((.*)\)\s+./.test(str))
		{
			var expr = RegExp.$1
			if (/^if\s+\(.*\)\s+(.+)$/.test(bustr))
			coms = RegExp.$1; else return "if: Empty if.\n"
			els = ""
		} else
		return "if: Empty if.\n"

		expr = expr.replace(/\slt\s/g,"<").replace(/\sgt\s/g,">").replace(/\sand\s/g,"&&").replace(/\sor\s/g,"||")
		if ((expr = ReplaceAllVars(expr),IOResult) || (expr = ReplaceW(expr),IOResult))
		return out+'\n'+ErrorMsg(IOResult)
		expr = sheval(PriRep(expr))

		if (IOResult) return expr
		if (expr) return Exec(coms); else
		if (els!='') return Exec(els)
		return ""
	} else
	if (com=='foreach')
	{
		Break.push(0)
		if (/^foreach (.+) \((.+)\);(.+)$/.test(bustr))
		{
			var varname = StripSlashes(RegExp.$1),
			comstr = RegExp.$3,
			list = ReplaceAllVars(RegExp.$2)
			if (IOResult) return ErrorMsg(IOResult)
			list = AddMask(list).slice(1,-1)
			list = list.snsplit()

			for (i = 0; i<list.length && !Break.top(); i++)
			{
				SetVar(varname, list[i])
				out+= Exec(comstr)
				if (Break.top()==2) Break.rep(0)
			}

		}
		Break.pop()
		return out
	} else
	if (com=='while')
	{
		var MAX = 1000
		Break.push(0)
		if (/^while\s+\((.+)\);(.+)/.test(bustr))
		{
			var expr = RegExp.$1, comstr = RegExp.$2, ex
			expr = expr.replace(/\slt\s/g,"<").replace(/\sgt\s/g,">").replace(/\sand\s/g,"&&").replace(/\sor\s/g,"||")
			do {
				ex = expr
				if ((ex = ReplaceAllVars(ex),IOResult) || (ex = ReplaceW(ex),IOResult))
				return out+'\n'+ErrorMsg(IOResult)
				ex = sheval(PriRep(ex))
				if (IOResult)
				{
					out = "while: "+ex
					break
				}
				if (ex) out+=Exec(comstr)
				if (Break.top()==2) Break.rep(0)
			}
			while (ex && --MAX && !Break.top())
		}
		if (!MAX) out+="\nwhile: Overload."

		Break.pop()
		return out
	} else
	if (com=='rm')
	{
		EL(0)
		var code
		Mask=DoName(args)
		for (i = 0; i<Mask.length; i++)
		if (fexists(Mask[i]),IOResult || fdelete(Mask[i]),IOResult) EL(IOResult),out+="rm: "+ExtractName(Mask[i])+": "+ErrorMsg(IOResult)+'\n'
		return out
	} else
	if (com=='cut')
	{
		EL(0)
		if (cnt<1) {EL(3);return '\nMissing argument.'}
		if (key=='') key='\n'; else key=key.substr(1)

		Mask = DoName(args.slice(1))
		for (i = 0; i<Mask.length; i++)
		{
			var cont = fget(Mask[i])
			if (out!='') out+='\n'
			if (IOResult) EL(IOResult),out+=ErrorMsg(IOResult); else
			out+=Cut(cont,args[1],key)
		}
		return out
	} else
	if (com=='wc')
	{
		EL(0)
		Mask = DoName(args)
		for (i = 0; i<Mask.length; i++)
		{
			var fr=Mask[i]
			var con=fget(fr)
			if (IOResult) EL(IOResult),out+='\n'+ErrorMsg(IOResult); else
			if (con=='') var lines=0,words=0,chars=0; else
			{
				var lines = con.split(/\n/).length
				var words = con.split(/\s/).length
				var chars = con.replace(/\n /g,"").length

				if (out!='') out+= '\n'

				if (key=='') out+= lines+' '+words+' '+chars; else
				{
					if (key.m('l')) out+=(lines+' ')
					if (key.m('w')) out+=(words+' ')
					if (key.m('c')) out+=(chars+' ')
				}
			}
		}
		return out
	} else
	if (com=='eval')
	{
		return Exec(parms)
	} else
	if (com=='set' || com=='@')
	{
		if (key!="")
		{
			if (key.m('r')) ROMount = 1
			if (key.m('w')) ROMount = 0
			if (key.m('q')) DelConf = 1
			if (key.m('x')) DelConf = 0
			if (key.m('s')) ScrollDown = 1
			if (key.m('f')) ScrollDown = 0
			if (key.m('o')) cursor = ocursor = '_', bcursor = ' '
			if (key.m('O')) cursor = ocursor = '\uE00F\uE007', bcursor = ''
			if (key.m('b'))
			{
				if (cHnd!=null) clearInterval(cHnd)
				var time
				if (!cnt || isNaN(time = parseInt(args[1])))
				time = 400				
				cHnd = setInterval('cursor = cursor==bcursor?ocursor:bcursor;Write("")',time)
			}
			if (key.m('B') && cHnd!=null) clearInterval(cHnd),cHnd = null, cursor = ocursor
			if (key.m('H')) KeepHistory = 0
			if (key.m('h')) KeepHistory = 1
			if (key.m('k')) KeyDebug = 1
			if (key.m('K')) KeyDebug = 0

			return ''
		};


		if (VarValues.length!=VarNames.length)
		{EL(255);return 'Fatal error. System malfunction.'}

		if (!cnt)
		{
			var Out = new Array()
			for (i=0;i<VarValues.length;i++)
			Out[i] = VarNames[i]+'='+VarValues[i]
			EL(0)
			return Out.sort().join("\n")
		}
		var rest, name
		for (i = 1;i<=cnt;i++)
		{
			for (rest = "", j = i; i<cnt && !/^[^=]+=/.test(args[i+1]); i++)
			rest+=" "+args[i+1]

			name = args[j]+rest
			if (/^([^=])([=+-])(.{0,65535})$/.test(name) || /^([^=][^=+-]+)([=+-])(.{0,65535})$/.test(name))
			{
				var name = RegExp.$1, val = RegExp.$3, sgn = RegExp.$2+val, brk

				if (sgn=="++" || sgn=="--")
				{
					val = GetVar(name)
					if (IOResult) return "set: "+ErrorMsg(IOResult)
					val = parseInt(val)
					sgn=="++"?val++:val--
					val+=""
				} else if (sgn.c(0)!="=") return "set: "+ErrorMsg(IOResult = errInvSyntax)

				if (val.m(" ") && val.c(0)!="(") val = "("+val+")"
				if (name.m("\\")) return ErrorMsg(IOResult = errInvSyntax)
				if (val.c(0)=="(" && val.l()!=")")
				for (i++;i<=cnt && args[i-1].l()!=")";i++)
				val+=" "+args[i]

				if (/^[\W\d]/.test(name)) {EL(IOResult=errInvVarName);return ErrorMsg(IOResult)}

				// Слеши перед [ и ] для старого NC убраны - он их не понимает

				if (!MZ && NC && Version < 5)
				var ts = new RegExp("^([^[]+)\\[([^]])*\\](.{0,})$").test(name); else
				var ts = /^([^\[]+)\[([^\]])*\](.{0,})$/.test(name)

				if (ts)
				{
					var name = RegExp.$1, idx = RegExp.$2
					if (RegExp.$3!="") {EL(255);return name+": Syntax error."}
					var val_t = GetVar(name+"[*]")
					if (IOResult) val_t = ""
					var Vals = val_t.split(" ")
					if (idx<1 || idx>Vals.length) {EL(IOResult=errOutOfBounds);return ErrorMsg(IOResult)}

					if (idx=="*")
					Vals = val.split(" ");else
					Vals[idx-1] = val
					if (Vals.length>1) val_t = "("+Vals.join(" ")+")"
					else val_t = Vals[0]
					val = val_t
				}

				val = AddMask(val_t = val)
				if (val.slice(1,-1)==StripSlashes(val_t)) val = val.slice(1,-1)
				SetVar(name,StripSlashes(val))
				if (IOResult) return "set: "+ErrorMsg(IOResult)
			}
		}
		return ''

	} else
	if (com=='shift')
	{
		var idx,str;
		if (!cnt) str = "argv"; else str = args[1];
		for (i in VarNames)
		if (VarNames[i] == str && /\(([^)]*)\)/.test(VarValues[i]))
		{
			str = RegExp.$1;
			idx = str.indexOf(' ');
			if (idx<0)
			VarValues[i] = '()'; else
			VarValues[i] = '('+str.substr(idx+1)+')';
		};
		return '';
	} else
	if (com=='save')
	{
		if (!cnt) {EL(3);return 'Missing argument.'}
		if (MountExists(args[1] = FullName(args[1])),IOResult)
		{EL(7);return 'Invalid argument.'}
		if (Names.length != Access.length || Names.length != Files.length)
		{EL(255);return 'File system error.'}
		var len = 0,
		quote = new Function("str","return str.replace(/~/g,'~1').replace(/\\x00/g,'~2')")

		for (i = 0;i<Names.length;i++)
		if (Names[i].substr(0,5) != '/dev/')
		out+=quote(Names[i])+'~\n'+quote(Access[i])+'~\n'+quote(Files[i])+'~\n', len++

		fput(args[1],len+'~\n'+out), out = ""
		if (IOResult) return ErrorMsg(IOResult)
		return 'File system was saved.'
	} else
	if (com=='load')
	{
		if (!cnt) {EL(3);return 'Missing argument.'};
		if (out = fget(FullName(args[1])),IOResult)
		{EL(7);return 'Invalid argument.'};
		var Syst = out.split("~\n"), count = parseInt(Syst[0]); out = ''
		if (Syst.length<4)
		{EL(7);return 'Invalid argument.'}
		var quote = new Function("str","var nl = String.fromCharCode(0);return str.replace(/~2/g,nl).replace(/~1/g,'~')")

		Files = new Array()
		Names = new Array()
		Access= new Array()

		for (i = 0;i<count;i++)
		{
			Names[i] = quote(Syst[i*3+1])
			Access[i] = quote(Syst[i*3+2])
			Files[i] = quote(Syst[i*3+3])
		}
		MountList()
		return 'File system was loaded.'
	} else
	if (com=='unset')
	{
		var reg
		if (!cnt) {EL(3);return 'Missing argument.'};
		for (j = 1;j<=cnt;j++)
		{
			reg = new RegExp("^"+args[j].replace(/\./g,"\\.").replace(/\?/g,".").replace(/\*/g,".*"))
			for (i = 0; i<VarNames.length; i++)
			if (reg.test(VarNames[i]))
			{
				VarNames = DeleteItem(VarNames,i);
				VarValues = DeleteItem(VarValues,i);
				i--
			}
		}
		return ""
	} else
	if (com=='ps')
	{
		EL(0)
		out=Norm2('PID',4)+Norm2('CMD',14)+'Description'+'\n'
		out+=Norm2('0',4)+'jush\n'+Norm2('1',4)+com+'\n'
		for (i=0; i<Chain.length; i++)
		{
			j = ExtractName (Chain[i])
			out+=Norm2(PIDs[i],4)+Norm2(j,14)+GetDescr(j)+'\n'
		}
		return out
	} else
	if (com=='kill')
	{
		EL(0);
		if (cnt<1) {EL(3);return 'Missing argument.'};
		if (args[1]=='all')
		{
			Chain = new stack()
			PIDs  = new stack()
			return 'All processes are killed.'
		};
		var n = parseInt(args[1])
		var p = PIDs.find(n)

		if (isNaN(n)) return 'Invalid argument.'
		if (!n) return Exec('bye')
		if (n==1 || p<0) return n+': No such process.'
		Chain.del(p)
		PIDs.del(p)
		return n+': Killed.'
	} else
	if (com=='mail')
	{
		return 'Mail gate unreachable.'
		if (!cnt) return Run('dialog [Enter mail address: ] [mail PARM]')
		if (!/\S/.test(args[1])) return ""
		if (cnt<2) return Run('dialog [Enter message text: ] [mail '+args[1]+' PARM]');

		message=str.split(' ').slice(2).join(' ');
		if (NC) message=escape(message);
		if (args[1].m('@')) 
		{
			SetNavi('http://junix.kzn.ru/unix/CGI/gate2.cgi?email='+args[1]+
			'&login='+login+'&message='+message+'&'+Math.random());
			return 'Message was send to mail gate.';
		};
		return "Invalid e-mail address."
	} else
	if (com=='sed')
	{
		if (cnt<1) {EL(3);return '\nMissing argument.'};
		args=nstr.snsplit(' ');

		var files=new Array();
		var script='',res,lineout=1;
		for (i=1;i<args.length;i++)
		if (args[i]=='-f')
		{
			res=fget(FullName(args[++i]));
			if (!IOResult)
			script+=res.replace(/[\n]/g," ");
		} else
		if (args[i]=='-e') script+=args[++i]; else
		if (args[i]=='-n') lineout=0;
		else
		{
			Mask = DoName(new Array("",args[i]))
			for (var k=0;k<Mask.length;k++)
			{
				res=fget(Mask[k]);
				if (IOResult) EL(IOResult),out+='\n'+ErrorMsg(IOResult); else
				out+=Sed(res,script.snsplit(),lineout)
			};
			script='';
		};
		return out;
	} else
	if (com=='more')
	{
		pmore=0;

		Mask = DoName(args);
		for (i = 0; i<Mask.length; i++)
		{
			var r = fget(Mask[i])
			if (IOResult) out+='\n'+ErrorMsg(IOResult),EL(IOResult); else
			out+=r
		}

		More (out)
		return ''
	} else
	if (com=='fg')
	{
		if (pHnd==null) return ''
		if (cnt<1) {EL(3);return 'Missing argument.'}
		var n = parseInt(args[1])
		var p = PIDs.find(n)

		if (isNaN(n) || p<0 || n<0) return ""
		clearInterval(pHnd), pHnd = null
		com = Chain[p]
		Chain.del(p)
		PIDs.del(p)

		pHnd = setInterval("BackExec()",1000)
		return Exec(com)
	} else
	if (com=='df')
	{
		var len = (Files+Access+Names).length
		out = "Filesystem          Used  Available  Use% Mounted on\n"+
		"----------          ----  ---------  ---- ----------\n"+
		Norm2("Junix",12)+Norm(len,10)+Norm("-",10)+"     - /\n"
		var Sys, Out
		for (i = 0; i<Device.length; i++)
		{
			Sys = Device[i].split(",")
			Out = favail(Sys[0],Sys[1])
			if (Out[0]=="-" || Out[1]=="-") var ratio = "-"; else
			var ratio = Math.floor(Out[0]*100/Out[1])

			out+=Norm2(CutStr(Device[i],12),12)+Norm(Out[0],10)+Norm(Out[1],10)+Norm(ratio,5)+" "+Norm2(CutStr(Mount[i],10),10)+"\n"
		}
		return out
	} else
	if (com=='icq')
	{
		if (NaviCheckBrowser()) return "icq: Your browser doesn't support the command."
		var Icq, file= "/etc/.icqalias"
		if (key.m("a") && !cnt)
		{
			Icq = fget(file)
			if (IOResult) return ''
			Icq = Icq.split("\n")
			for (i = 1; i<Icq.length; i+=2)
			out+=Icq[i]+" - "+Icq[i-1]+"\n"
			return out
		}
		
		if (!cnt) return Run('dialog [Enter ICQ number: ] [icq PARM]');
		if (cnt<2) return Run('dialog [Enter message: ] [icq '+args[1]+' PARM]');

		var message=str.split(' ').slice(2).join(' ');
		var icq = args[1]
		if (/\D/.test(icq))
		{
			Icq = fget(file)
			if (IOResult)
			if (/\D/.test(message)) return "Invalid ICQ number."; else
			Icq = message+"\n"+icq

			Icq = Icq.split("\n")
			for (i = 1; i<Icq.length; i+=2)
			if (Icq[i]==icq) break

			if (/\D/.test(message))
			{
				if (i>=Icq.length) return "ICQ alias not found."
				icq = Icq[i-1]
			} else
			{
				Icq[i-1]  = message
				Icq[i]= icq
				fput(file, Icq.join("\n"))
				if (IOResult)
				return ErrorMsg(IOResult)
				return "ICQ alias successfully saved."
			}
			
		}

		if (NC) message=escape(message)
		SetNavi('http://msg.mirabilis.com/scripts/WWPMsg.dll?fromemail='+
		login+'&from='+login+'&subject=&to='+icq+'&body='+message);

		return 'Message was sent to ICQ server for '+icq+'.';
	} else
	if (com=='passwd')
	{
		if (!cnt) return Run('dialog [Enter old password: ] [passwd PARM]')
		if (cnt<2) return Run('dialog [Enter new password: ] [passwd '+args[1]+' PARM]')
		password = args[2]
		return ""
	} else
	if (com=='where')
	{
		if (!cnt) {EL(3);return 'Missing argument.'}
		var Paths=GetVar('path[*]'),name;
		if (IOResult) return IOResult
		Paths = Paths.split(" ")
		for (i in Paths)
		{
			fexists(name = FullPath(Paths[i])+args[1])
			if (!IOResult) out+=name+'\n'
		}
		if (!out)
		{
			var List = Run('?').split(' ')
			for (i in List)
			if (List[i]==args[1])
			{
				out = 'Built-in command.'
				break
			}
		}

		return out
		
	} else
	if (com=='d')
	{
		if (key.m('l'))
		{
			EL(0)
			if (cnt<1) {EL(3);return 'Missing argument.'};
			var type = sheval("typeof("+args[1]+")")
			if (IOResult) return type

			if (type=="undefined") {EL(7);return 'Invalid argument.'};
			if (/object/.test(type))
			{
				var Obj = args[1].split('.');

				for (i = 1; i<Obj.length; i++)
				if (!sheval(Obj.slice(0,i).join('.')) || IOResult)
				{
					EL(3)
					return 'JavaScript object not found.'
				}

				var obj = sheval(args[1]), type
				if (IOResult) return obj
				for (i in obj)
				type = typeof(obj[i]),
				out+=i+'='+((type=="string" || type=="number" || type=="boolean")?(""+obj[i]):("["+type+"]"))+"\n"
				return out
			};
			if (type=="string" || type=="number") return sheval(args[1]);
			EL(7)
			return 'Type "'+type+'" is unknown.'
		} else
		if (key.m('m'))
		{
			if (cnt<2)
			{
				if (args[1].nm(',')) {EL(3);return 'Missing argument.'};
				args=(','+args[1]).split(',');
			};

			var res = sheval(args[1]+'='+args[2])
			return IOResult?res:""
		} else
		if (key.m('s') || key.m('a'))
		{
			if (cnt<1) args[1]="",cnt=1;
			for (i = 1; i<=cnt; i++)
			{
				if (sheval("typeof("+args[i]+")")=="undefined" || IOResult) {EL(7);return 'Invalid argument.'};
				if (key.m('a')) alert(sheval(args[i])); else
				out+=sheval(args[i])+(key.m('n')?' ':'');
			}
			return out
		} else
		if (key.m('u'))
		{
			if (cnt<1) args[1]="",cnt=1;
			for (i=1; i<=cnt; i++)
			{
				if (sheval("typeof("+args[i]+")")=="undefined" || IOResult) {EL(7);return 'Invalid argument.'};
				Stack.push(sheval(args[i]))
			}
			return ''
		} else
		if (key.m('p'))
		{
			if (!cnt) return Stack.pop()
			for (i=1; i<=cnt; i++)
			sheval(args[i]+'=Stack.pop()')
			return ""
		} else
		if (key.m('o') && cnt>1)
		{
			sheval(args[1]+"=window.open('"+args[2]+"')")
			return "Opened."
		}
		return EL(IOResult = errFewArguments), "d: "+ErrorMsg(IOResult)
	} else
	if (com=='mount')
	{
		if (!cnt)
		{
			var Dev,vfs;
			out+="  mounted     mounted over     vfs    options\n"+
			     "----------- ---------------- ------- ---------\n"+
			     "Junix       /                jsfs";

			for (i=0;i<Mount.length;i++)
			{
				Dev = Device[i].split(",")
				out+="\n"+Norm2(CutStr(Dev[1],11),11)+Norm2(CutStr(Mount[i],16),16)
				switch (Dev[0])
				{
					case "Extended":if (navigator.platform=="Win32") vfs="vfat";else vfs="extd";break
					case "Object":	vfs="objt";break
					case "Cookie":	vfs="cook";break
					default:	vfs="---"
				}
				out+=Norm2(vfs,7)
				if (Dev.length>2 && Dev[2].m("r")) out+="R/Only "
				if (vfs=='cook') out+="JZipped"
			};
			return out
		};
		if (cnt<2) {EL(3);return 'Missing argument.'};

		if (key.m("c")) cont = args[1]; else
		{
			fexists(args[1] = FullName(args[1]));
			if (IOResult) {EL(7);return 'Invalid argument.'};
			var cont = fget(args[1]), acc = faccess(args[1])

			if (!IOResult && acc.c(0)!="b") return "Block device required."
			if (IOResult || cont.nm(",")) {EL(7);return 'Invalid argument.'};
		};

		if (key.m("r") || ROMount) cont+=",r"
		args[2]=FullPath(args[2])
		if (args[2]=="/") return "Device busy."

		for (i in Mount) if (Mount[i] == args[2])
		{
			Device[i] = cont;
			return "Device was remounted.";
		};
		Mount = Mount.concat(args[2]);
		Device  = Device.concat(cont);
		return "Device was mounted.";
	} else
	if (com=='unmount')
	{
		if (!cnt) {EL(3);return 'Missing argument.'};
		if (args[1]=="/") return "Device busy.";
		args[1] = FullPath(args[1]);
		for (i=0;i<Mount.length;i++)
		if (Mount[i] == args[1])
		{
			Mount = DeleteItem(Mount,i);
			Device = DeleteItem(Device,i);
			return "Device was unmounted.";
		};
		return "Could not find anything to unmount.";	
	} else
	if (com=='tail')
	{
		var nums, cyp, file = args[cnt]
		if (cnt<1) file = ""
		if (/\s([\+-]?)(\d+)\s/.test(str))
		{
			if (RegExp.$1=='+' || !key.length) nums=RegExp.$2
			else nums=-RegExp.$2             
		} else nums=10
	
		if (key.m('c'))
		{
			cyp='c'
			if (key.m('b')) nums*=512
		} else cyp='l'
		Mask = DoName(new Array("",file))
		for (i = 0; i<Mask.length; i++)
		{
			var con=fget(Mask[i])
			if (IOResult) EL(IOResult),out+='\n'+ErrorMsg(IOResult); else
			switch(cyp)
			{
				case 'c': if (nums>=0)
					  out+=con.substr(0,nums); else
					  if (con.length+nums<0)
					  out+=con; else
					  out+=con.substr(con.length+nums);
					  break;
				case 'l': var Lines=con.split(/[\n]/);
					  if (nums>=0)
					  out+=Lines.slice(0,nums).join('\n'); else
					  if (Lines.length+nums<0)
					  out+=con; else
					  out+=Lines.slice(Lines.length+nums).join('\n');
					  break;
			};
		};
		return out;
	} else
	{
		var scval,arval,ar,sc
		arval = GetRealVar("argv"); if (IOResult) arval = "()"
		scval = scriptname; if (IOResult) scval = "jush"

		if (/(\S+)\s+(.+)/.test(str))
		ar = '('+RegExp.$2+')',sc = RegExp.$1; else ar = '()',sc = str

		SetVar('argv',ar),scriptname = sc
		var name
		parms=key+parms
		args=(com+(parms!=''?' ':'')+parms).split(' ')
		cnt=args.length-1
		name = ffind(FullName(args[0]))

		if (!IOResult) var fa = faccess(name)
		if (!IOResult && (fa.m('x') || /^j[us]sh$/.test(bustr)))
		{
			if (fa.m('d')) return com+': '+ErrorMsg(errNoAccess)
			TTL--
			var c = fget(name),arg,reg

			// substr введен для исправления глюка с \n
			if (/^(#!\/bin\/)(j[us]sh)/.test(c) || /^(#!)(j[us]sh)/.test(c))
			{
				var len = (RegExp.$1+RegExp.$2).length
				if (c.charAt(len)==';' || c.charAt(len)=='\n')
				bustr = RegExp.$2, c = c.substr(len+1)
			}

			if (IOResult) return 'Unknown command.'
			if (bustr == "jssh") out = sheval(c); else
			out = Exec(c)

			if (typeof(out) == "undefined") out = ""

			TTL++,scriptname = scval,SetVar('argv',arval)
			return out
		}
	}
	EL(15),scriptname = scval,SetVar('argv',arval)
	for (i = 0; i<com.length; i++)
	if (CODES.indexOf(com.c(i))>192) return com+': Command not found. Try to change keyboard layout.';
	out = com+': Command not found.'
	return out
};

// Поиск последней закрывающей скобки в строке нач. с откр. скобки
function SearchLast(str,n)
{
	var sk=0;
	for (i=n;i<str.length;i++)
	{
		if (str.c(i)=='{') sk++; else
		if (str.c(i)=='}') sk--;
		if (!sk) break;
	};
	return i;
};

// Поиск имени файла для вывода
function SearchPipeOut(str,n)
{
	for (var i=n;i<str.length;i++)
	if ('<|;{}'.m(str.c(i))) break;
	return i;
};

// Поиск имени файла для ввода
function SearchPipeIn(str,n)
{
	for (var i=n;i<str.length;i++)
	if ('>|;{}'.m(str.c(i))) break;
	return i;
}

function ShellComs(com)
{
	if (/^if\s*\(.*\)\s+then$/.test(com) || /^else\s+if\s*\([^)]*\)\s*then$/.test(com)) return "endif"
	if (/^while\s*\(.*\)$/.test(com) || /^foreach/.test(com)) return "end"
	return ""
}

// проверяет нет ли окружающих символ пробелов
function ChSpc(str,i)
{
	return str.c(i-1)==" " && str.c(i+1)==" "
}

function Exec(str)
{
	label = ""
	sline = 0
	var bound = new stack(), longcom = ""
	str=str.replace(/\n/g,';').replace(/\r/g,"")
	str=str.replace(/([^(\\)])\|\|/g,'$1;if (!errorlevel);');
	str=str.replace(/([^(\\)])\&\&/g,'$1;if (errorlevel);');
	var Out='',oldcom,endcom,c,i,com='',pos,s,multi=0,out,needtoout=0,outname,cont,pipe = 0,keep = 0, dh,brc=0
	str=str+';'

	var gotoTTL=2000


	while (/'([^']*)'/.test(str))
  	str = str.replace(/'[^']*'/,QuoteMeta3(RegExp.$1))

	for (i = 0;i<str.length;i++)
	{
		c = str.c(i)
		if (keep)
		{
			if (c == '`') keep = 0
			com+=c
		} else
		switch (c)
		{
		case '`': com+=c;keep = 1;break
		case '\\':c=str.c(++i)
			  com+='\\'+c;break
		case '(': brc++;com+=c;break
		case ')': brc--;com+=c;break
		case '{': pos=SearchLast(str,i);
			  multi=(com=='');
			  if (multi)
			  s=str.substring(i+1,pos); else
			  s=str.substring(i,pos+1);
			  com+=s,i=pos;break;
		case '>': if (brc || bound.length || ChSpc(str,i)) {com+=c;break}
			  needtoout=1;
			  if (str.c(i+1)=='>') needtoout=2;
			  pos = SearchPipeOut(str,i);
			  outname = StripSlashes(ReplaceW(ReplaceAllVars(str.substring(i+needtoout,pos))))

			  if (outname == "") IOResult = errMissingName

			  if (IOResult)
			  Out+= ErrorMsg(IOResult)+'\n', needtoout = 0
			  i=pos-1;break

		case '<': if (brc || bound.length || ChSpc(str,i)) {com+=c;break}
			  if (str.c(i+1)=='<')
			  {
				if ((pos = str.indexOf(';',i+2))<0)
				pos = str.length
				dh = str.substring(i+2,pos)
				pipe = 1
				if ((s = str.indexOf(';'+dh,pos))<0)
				s = str.length
				fput ("",cont = str.substring(pos+1,s).replace(/;/g,'\n')+'\n')
				i = s+dh.length
				break
			  }


			  pos = SearchPipeIn(str,i);
			  s = str.substring(i+1,pos);
			  i = pos-1;
			  s = StripSlashes(ReplaceW(ReplaceAllVars(s)))

			  if (!IOResult)
			  if (s == "")
			  IOResult = errMissingName; else
			  cont = fget(s)

			  if (IOResult) Out+='\n'+ErrorMsg(IOResult),EL(IOResult)
			  else EL(0), fput("", cont+'\n'), pipe = 1 // + "конец файла"
			  break

		case '|': if (ChSpc(str,i)) {com+=c;break} else pipe = 1
		case ';': if (Break.length && Break.top()) return Out
			  if (label!="")
			  {
				if (/^:(.+)$/.test(com) && RegExp.$1 == label)
				label = ""

				com = ""
				break
			  }

			  if (/^:(.+)$/.test(com)) {com = "";break}

			  if (/^if \((!?errorlevel)\)$/.test(com))
			  if (sheval(RegExp.$1) || IOResult)
			  return Out; else {com = "";break}

			  if (com == bound.top()) com = bound.pop(); else
			  if ((endcom = ShellComs(com)) != "") bound.push(endcom)

			  if (bound.length) {longcom+= com+c;com="";break}
			  if (longcom!= "") oldcom = com = longcom,longcom = ""; else
			  {
				oldcom = com
				if (!multi)
				if ((com = ReplaceAllVars(com),IOResult) || (com = ReplaceW(com),IOResult))
				{Out+='\n'+ErrorMsg(IOResult);break}
			  }

			  if (com == "") out=""; else
			  if (com.l()=="&")
			  com = com.replace(/"/g,'\\"'),
			  out = SetChain(com.substr(0,com.length-1))+" "; else
			  if (multi) out = Exec(com,"",++sline); else
			  {
				if (/^goto +(.+)$/.test(com))
				{
					if (--gotoTTL<0) return "goto: Loop found. Terminated.";
					label = RegExp.$1
					if (label!="") i = -1 // -1, т.к. в конце итерации добавится 1
					com = ""
					break
				}

				if (/^(j[us]sh) +(.+)$/.test(com))
				com = RegExp.$2, oldcom = RegExp.$1
				out = Run(com,oldcom,++sline)
			  }

			  if (pipe) fget(""), pipe = 0
			  switch (needtoout)
			  {
			  case 0:if (c == "|") fput("",out); else Out+=out;break
			  case 2:var cont=fget(outname)
				 if (IOResult) cont = "", IOResult = errNoError
				 out=cont+out
			  case 1:var res = fput(FullName(outname),out)
				 if (IOResult) Out+='\n'+ErrorMsg(IOResult),EL(IOResult)
			  };
			  multi=needtoout=0;com='';
			  break;

		default : com+=c;
		}
	}
	return Out
}