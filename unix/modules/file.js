// Обрабатывает регулярные выражения для SearchMask
function SMCheckReg(str)
{
	for (var c, out = "",bracket = "", i = 0; i<str.length; i++)
	{
		c = str.c(i)
		if (bracket!="")
		{
			if (str.c(i-1)=="\\")
			bracket+=c; else
			if (c=="]")
			{
				if (bracket=="[") out+="\\[\\]"; else
				out+=bracket+c
				bracket = ""
			} else
			bracket+=QuoteMeta(c)

		} else
		if (c=="[") bracket+=c; else
		out+=c
	}
	out = out+QuoteMeta(bracket.substr(0,1))+bracket.substr(1)
	return out
}
// Проверяет нужно ли производить поиск по образцу
function CheckMask(str)
{
	return /^[\[\]\*\?]/.test(str) || /[^(\\)][\[\]\*\?]/.test(str)
};

// Добавление каталога монтирования
function MountList()
{
	var last = Files.length,ch;
	var Mount = new Array('navigator',"cookie");
	var Dirs  = new Array('Object,navigator','Cookie,0');

	if (location.protocol=="file:")
	{
		if ((OP || NC) && /^\/(.)/.test(location.pathname) && navigator.javaEnabled())
		{
			Dirs[Dirs.length] = Files[last]  = "Extended,"+RegExp.$1.toLowerCase()+":"
			Mount[Mount.length] = "local",
			Names[last]    = "/dev/local/hdd"+(RegExp.$1.toUpperCase().charCodeAt(0)-65),
			Access[last++]   = "cr--";
		}

		if (IE)
		{
			for (var i=0;i<26;i++,last++)
			ch = String.fromCharCode(97+i),
			Access[last] = "br--",
			Names[last]  = "/dev/local/"+(i>1?"wd":"fd")+ch,
			Files[last]  = "Extended,"+ch+":";
			if (/^\/?(.)/.test(location.pathname))
			Dirs[Dirs.length] = "Extended,"+RegExp.$1.toLowerCase()+":",
			Mount[Mount.length] = "local";
		};
	};

	for (i=0;i<Mount.length;i++)
	{
		Names[last+i] = "/dev/"+Mount[i];
		Access[last+i]= "br--";
		Files[last+i] = Dirs[i];
	}
	return ""
};
// Перехват ошибки (для NC)

function onerror(msg, URL, lineNum)
{ 
	if (/\/([^\/]+)$/.test(URL)) URL = RegExp.$1
	netscape.security.PrivilegeManager.disablePrivilege('UniversalFileAccess')

	fappend ('/core.dump','Fatal error ( "'+msg+'" )\nin line '+lineNum+' of script "'+URL+'".\n\n')
	Type(P())
	return true
};

// Ф-я для сортировки по длине ("длинные" вперед). Сделал свою
// т.к. NC 4.7 грохается при использовании встроенной ф-и с параметром ф-я

function QuickSort(List,a,b)
{
	var Lo,Hi,Mid,T;
	Lo = a;
	Hi = b;
	Mid = List[Math.floor((Lo+Hi)/2)]
	do{
		while (List[Lo].length > Mid.length) Lo++;
		while (List[Hi].length < Mid.length) Hi--;
		if (Lo <= Hi) T = List[Lo], List[Lo] = List[Hi], List[Hi] = T;
		Lo++;
		Hi--;
	}
	while (Hi > Lo);
	if (Hi > a) List = QuickSort(List, a, Hi);
	if (Lo < b) List = QuickSort(List, Lo, b);
	return List;
};

// Поиск пути или файла для клавиши Tab
function SearchPath(str)
{
	var p=-1,n,s,len,name,List
	var rest = str
	var Div = str.split(/[ ><|;)("']/)

	if (Div.length<2) return str		// Команда без параметра
	for (var p = Div[Div.length-1].length, i = Div.length-2; i>=0; i--)
	{
		if (Div[i].l()=="\\") p+= Div[i].length+1
		else break
	}

	delete Div
	com = str.substring(0,str.length-p)
	len = (name = StripSlashes(FullName(str = StripSlashes(str.substr(com.length))))).length
	List = SearchMask(name+"*/")
	if (name.l()!="/")
	List = SearchMask(name+"*").concat(List).concat(SearchMask(FullPath(str)+"*"));
	if (!List.length)
	{
		List = flist(ExtractPath(name))
		if (!IOResult) Type('\n'+List.join(', ')+'\n'+P())
		return com+QuoteMeta2(str)
	};
	List = QuickSort(List,0,List.length-1)

	s = List[0];
	for (i=0; i<List.length; i++)
	{
		for (j=0;j<List[i].length;j++)
		if (s.c(j) != List[i].c(j)) break
		if (len<=j) s = s.substring(0,j)
	};
	return com+QuoteMeta2(str+s.substr(len))
};

// Производит поиск пути файла по маске

function SearchMask(str)
{
	str = FullName(str)
	if (!CheckMask(str)) return new Array(str)
	var Path = new Array("/")
	if (str == "/") return Path

	if (!/(\/[^\/]*\/?)(.{0,})/.test(str))
	{IOResult = errNotFound; return new Array()};
	var path = "",i,j,len,reg, pathadd

	do {
		str  = RegExp.$2
		path+= SMCheckReg(RegExp.$1).replace(/\//g,"\\/").replace(/\./g,"\\.").replace(/\?/g,"[^\\/]").replace(/\*/g,"[^\\/]*")
		var Match = new Array();
		for (i in Path)
		{
			List = flist(Path[i]);
			if (IOResult) return new Array();

			reg   = new RegExp("^("+path+")$");
			for (j in List)
			if (reg.test(Path[i]+List[j])) Match[Match.length] = Path[i]+List[j]
		}
		Path = Match
	}
	while (/([^\/]*\/)(.{0,})/.test(str) || /(.+)(.{0,})/.test(str))

	if (!Path.length) IOResult = errNotFound
	return Path
};

// Нормализирует путь
function FullPath(path)
{
	if (path == "" || path == ".")  return WD
	if (path == "/") return "/"

	path = path.replace(/\.{3,}/g,"..")
	while (/\/\//.test(path)) path = path.replace(/\/\//g,"/");

	if (!/\/$/.test(path)) path+="/"
	path = path.replace(/^\.\//,WD)

	if (path.c(0) != "/") path = WD + path
	while (/[^\/]*\/\.\.\//.test(path)) path = path.replace(/[^\/]*\/\.\.\//,"");

	if (path =="") return "/"

	return path
};

// Выбирает имя файла

function ExtractName(str)
{
	if (/([^\/]+)$/.test(str)) return RegExp.$1; else return "";
};

// Выбирает путь до файла, в конце - слэш

function ExtractPath(str)
{
	if (/(.+\/)[^\/]*$/.test(str)) return RegExp.$1; else return "/";
};

// Выбирает путь до файла

function ExtractPath2(str)
{
	if (/(.+)\/[^\/]*$/.test(str)) return RegExp.$1; else return "";
};

// Нормализирует имя
function FullName(name)
{
	if (name == "/") return "/";
	if (name.nm("/")) return WD + name;
	return FullPath(ExtractPath(name))+ExtractName(name);
};


// Находим связь на файл
function FindLink(s)
{
	IOResult = errNoError;
	for (var i=0;i<Files.length;i++)
	if ((Files[i].substr(0,2)=='\n>') && (Files[i].substr(2)==s)) return i;
	return IOResult = errNotFound;
};

function ErrorMsg(num)
{
	EL(num)
	switch (num)
	{
		case errNoError:	return ''
		case errNotFound:	return 'No such file or directory.'
		case errNoAccess:	return 'Access denied.'
		case errFatalErr:	return 'Fatal file system error.'
		case errCookNoSpace:	return 'Not enougth space or browser declined request.'
		case errCantWriteDir:	return 'Cannot write to directory.'
		case errVarNotFound:	return 'Undefined variable.'
		case errInvVarName:	return 'Invalid variable name.'
		case errOutOfBounds:	return 'Subscript out of range.'
		case errInvIndex:	return 'Newline in variable index.'
		case errNoHome:		return 'No home directory.'
		case errFewArguments:	return 'Too few arguments.'
		case errNoNumber:	return 'Badly format number.'
		case errMissingName:	return 'Missing name.'
		case errEvalError:	return 'Expression error.'
		case errBinFile:	return 'Cannot read this binary file.'
		case errFileLocked:	return 'The file is locked by Windows.'
		case errInvSyntax:	return 'Invalid syntax.'
		case errCantChmod:	return 'Cannot change mode this file.'
	};
	return 'Unknown error.';
};

function LocalExists(name)
{
	IOResult = errNoError;

	for (var i in Names) if (name == Names[i]) return i;
	return IOResult = errNotFound;
};

function MountExists(name)
{
	var len,i,p=0,cur;
	IOResult = errNoError;
	name = FullPath(name);
	for (i in Mount)
	{
		if (name.charAt(1) == Mount[i].charAt(1) &&
		name.length >= (len = Mount[i].length) &&
		name.substr(0,len) == Mount[i] && p<len) p = len,cur = i;
	};
	if (p) return cur;
	return IOResult = errNotFound;
	
};

function fput(name,content)
{
	content+=""
	IOResult = errNoError
	if (name == "")
	{
		pipefile = content
		return errNoError
	}

	switch(ExtractName(name))
	{
		case "stderr":
		case "stdout":	Write(content);return ""
		case "nul":	return ""
	};

	var acc = faccess(ExtractPath(name))

	if (!IOResult && acc.nm('w')) return IOResult = errNoAccess
	IOResult = errNoError

	switch (name = FullName(name))
	{
		case "/dev/bmem": if (IE) return SetBuffer(content)
		case "/dev/random":
		case "/dev/null": return ""
		case "/dev/stat": window.status = content;return ""
	}

	if (arguments.length<3 || !arguments[2]) // Is make directory operation?
	{
		var acc = faccess(name)
		if (!IOResult)
		{
			if (name.l()=="/" || acc.c(0)=="d") return IOResult = errCantWriteDir
			if (fexists(name),!IOResult && acc.nm('w')) return IOResult = errNoAccess
		}
	}

	var res = LocalExists(name);
	if (!IOResult)
	{
		IOResult = errNoError
		if (/^\/dev\//.test(name)) return ""

		var acc = Access[res]

		if (acc.m('l')) return fput(Files[res].substr(2),content)
		if (acc.m('p')) {Files[res]+= content; return errNoError}
		if (acc.m('w')) {Files[res] = content; return errNoError}
		return IOResult = errNoAccess
	};

	var res = MountExists(name)

	if (!IOResult)
	{
		var Res = Device[res].split(',')
		if (Res.length>2 && Res[2].m('r')) return IOResult = errNoAccess;
		name = name.substr(Mount[res].length)
		var put = new Function("name,content,r","FileWrite"+Res[0]+"(name,content,r)")
		return put (name,content,Res[1])
	};

	// Файл не создан в локале, путь не смонтирован, создаем файл
	
	var len = Names.length;
	if (len != Access.length || len != Names.length)
	return IOResult = errFatalErr;

	Names[len] = name;
	Access[len] = umask;
	Files[len] = content;

	return IOResult = errNoError;
};


function fget(name)
{
	IOResult=errNoError
	if (name == "" || name == "-")
	{
		var pipe = pipefile
		return pipefile = "",IOResult=errNoError,pipe
	}
	switch (name = FullName(name))
	{
		case "/dev/bmem": if (IE) return GetBuffer()
		case "/dev/null": return ""
		case "/dev/random": return Math.floor(Math.random()*65535)
		case "/JUNIX"	: return "Written by Stepanischev Evgeny. 1999-2001 y."
		case "/dev/stat": return window.status
	}
	var acc = faccess(name)

	if (acc.nm('r')) return IOResult = errNoAccess

	if ((name.l()=="/" || acc.c(0)=="d") && (!IOResult || LocalDirEi(name),!IOResult))
	return IOResult=errNoError,flist(name).join("...")

	var res = LocalExists(name)

	if (!IOResult)
	{
		IOResult = errNoError;
		if (name == '/dev/nul') return ""

		var cont = Files[res], acc = Access[res]

		if (acc.m('l')) return fget(cont.substr(2))
		if (acc.m('p')) Files[res] = ""
		return cont
	};

	var res = MountExists(name);
	if (!IOResult)
	{
		var Res = Device[res].split(',')
		name = name.substr(Mount[res].length)
        return sheval("FileRead"+Res[0]+"('"+name+"','"+Res[1]+"')")
	};
	return IOResult = errNotFound;
};

function flist(path)
{
	path = FullPath(path)

	if (faccess(path).nm('r')) return new Array()

	var List = new Array(),i,j = 0, name;
	var Xnam = Names.concat(Mount);

	for (i in Xnam)
	if (Xnam[i].length > (len = path.length) &&
	path == Xnam[i].substr(0,len))
	{
		name = Xnam[i].substr(len);
		if (/^([^\/]+\/)/.test(name))
		{
			for (j = 0;j<List.length; j++)
			if (List[j] == RegExp.$1) break;
			List[j] = RegExp.$1;
		} else
		List[List.length] = name;
	};

	var res = MountExists(path);

	if (!IOResult)
	{
		var Res = Device[res].split(',');
		path = path.substr(Mount[res].length);
    	var MountList = sheval("FileList"+Res[0]+"('"+path+"','"+Res[1]+"')");
		if (!IOResult) List = List.concat(MountList);
	};
	IOResult = errNoError;

	return List;
};

function fexists(name)
{
//	if (name.m("\\")) return IOResult = errNotFound
	var len
	name = FullName(name)
	LocalExists(name)
	if (!IOResult) return IOResult

	// Может быть у нас директорий?
	var tname = FullPath(name)

	for (var i in Names) if (Names[i].length >= (len = tname.length)
	&& Names[i].substr(0,len) == tname) return IOResult = errNoError

	var res = MountExists(name)
	if (IOResult) return IOResult = errNotFound

	var Res = Device[res].split(',')
	name = name.substr(Mount[res].length)
    return sheval("FileExists"+Res[0]+"('"+name+"','"+Res[1]+"')")
}

function fdelete(name)
{
	name = FullName(name)
	var acc = faccess(name)

	if (IOResult) return IOResult; else
	if (fexists(name),!IOResult && acc.nm('w') || "cb".m(acc.c(0)) || faccess(ExtractPath(name)).nm('w') && !IOResult)
	return IOResult = errNoAccess

	var res
	while (res = FindLink(name),!IOResult)
	{
		Names=DeleteItem(Names,res);
		Files=DeleteItem(Files,res);
		Access=DeleteItem(Access,res);
	};

	var res = LocalExists(name);
	if (!IOResult)
	{
		Names=DeleteItem(Names,res);
		Files=DeleteItem(Files,res);
		Access=DeleteItem(Access,res);
		return IOResult = errNoError;
	};

	var res = MountExists(name);
	if (!IOResult)
	{
		var Res = Device[res].split(',');
		if (Res.length>2 && Res[2].m('r')) return IOResult = errNoAccess;
		name = name.substr(Mount[res].length);
	       	return sheval("FileDelete"+Res[0]+"('"+name+"','"+Res[1]+"')");
	};
	
	return IOResult = errNotFound;
};

function fsize(name)
{
	name = FullName(name);

	var res = LocalExists(name);
	if (!IOResult) return Files[res].length;

	IOResult = errNoError;
	var Xnam = Names.concat(Mount);

	if (/\/$/.test(name))
	for (var i in Xnam) if (Xnam[i].length >= (len = name.length)
	&& Xnam[i].substr(0,len) == name) return len;

	var res = MountExists(name);
	if (!IOResult)
	{
		var Res = Device[res].split(',');
		name = name.substr(Mount[res].length);
       	return sheval("FileSize"+Res[0]+"('"+name+"','"+Res[1]+"')");
	};
	
	// Путь выше смонтирован
	var len = name.length;
	for (i in Mount) if (Mount[i].substr(0,len) == name) return len;

	return IOResult = errNotFound;
};

function faccess(name)
{
	name = FullName(name);
	var res = LocalExists(name)
	if (!IOResult)
	{
		if (name.l()=="/") return "d"+Access[res].substr(1); else
		if (Access[res].m('l')) return 'l'+faccess(Files[res].substr(2)).substr(1); else
		return Access[res]
	}

	IOResult = errNoError

	var i, t_name = (name.l()=="/"?name:name+"/"), len = t_name.length

	for (i in Names) if (Names[i].length >= len
	&& Names[i].substr(0,len) == t_name) return "drwx";

	var res = MountExists(name);

	if (!IOResult)
	{
		var Res = Device[res].split(',');
		name = name.substr(Mount[res].length);

		Res[1] = Res[1].replace(/\\/g,"/")
		name   = name.replace(/\\$/,"")
       	return sheval("FileAccess"+Res[0]+"('"+name+"','"+Res[1]+"')")
	}

	// Путь выше смонтирован
	var len = name.length;
	for (i in Mount) if (Mount[i].substr(0,len) == name) return "drwx"
	
	return IOResult = errNotFound,"drwx"
};

function fchmod(name, r)
{

	IOResult = errNoError
	if (name == "" || name == "-" || ExtractPath(FullName(name)) == '/dev')
	return errCantChmod

	var acc = faccess(name)
	if (IOResult) return IOResult

	var res = LocalExists(name)
	if (!IOResult)
	{
		IOResult = errNoError
		var cont = Files[res], acc = Access[res]

		if (acc.m('l')) return fchmod(cont.substr(2))
		if (acc.c(0)!='-') return errCantChmod

		Access[res] = acc.c(0)+(r.m('r')?'r':'-')+(r.m('w')?'w':'-')+(r.m('x')?'x':'-')
		return IOResult = errNoError
	}

	var res = MountExists(name)
	if (!IOResult)
	{
		var Res = Device[res].split(',')
		name = name.substr(Mount[res].length)
       	return sheval("FileChmod"+Res[0]+"('"+name+"','"+r+"','"+Res[1]+"')")
	}
	return IOResult = errCantChmod
};


function ffind(str)
{
	if (fexists(str),!IOResult) return str
	var Paths=GetVar('path[*]'),name
	if (IOResult) return IOResult
	Paths = Paths.split(' ')

	str = ExtractName(str)
	for (i in Paths)
	{
		fexists(name = FullPath(Paths[i])+str)
		if (!IOResult) return name
	}
	return IOResult = errNotFound,""
};

//---------------------------------------------------//

function FileWriteObject(name)
{
	return IOResult = errNoAccess;
};

function FileWriteCookie(name,content) //,f
{
	var len = content.length, r

	if (arguments[2]=='direct') r = '', len-=2; else
	{
		r  = FileAccessCookie (name)
		if (IOResult) r = '#;'; else
		r = '#'+String.fromCharCode(48+(r.m('r')?1:0)+(r.m('w')?2:0)+
		(r.m('x')?8:0))
	}

	content = JZip(r+content,1,3)
	var d=new Date(2999,2,2),nd
	if (NC) nd='Wednesday, 30-Dec-37 23:59:59 GMT'; else nd=d.toGMTString()
	document.cookie= name + '=' + content + ';expires=' + nd

	if (FileSizeCookie(name) == len) return IOResult = errNoError
	return IOResult = errCookNoSpace
};

function FileWriteExtended()
{
	var name = arguments[0].replace(/\//g,"\\"),
	content = arguments[1],
	disknum = arguments[2].replace(/\\\\/g,"\\")

	if (/(.+\/)([^\/]+)$/.test(name))
	var path = '\\'+RegExp.$1,name = RegExp.$2; else var path = "\\";
	path = disknum+path;

	var fullname = path + name, idx = fullname.lastIndexOf("\\");
	if (idx >=0) fullname = fullname.substring(0,idx); else fullname = "\\";

	if (DelConf && !confirm("File "+fullname+"\\"+name+" will changed!"))
	return IOResult = errNoAccess;

	FileMkdirExtended(fullname);
	if (IOResult) return IOResult;

	IOResult = errNoError
	if (name.l()=="\\") return IOResult

	if (NC || OP)
	{
		netscape.security.PrivilegeManager.enablePrivilege('UniversalFileAccess');
		var fi=new java.io.File(path,name);
		if (fi.exists() && !fi.canWrite()) return IOResult = errNoAccess

		var f=new java.io.FileOutputStream(fi)

		for (var i=0;i<content.length;i++)
		f.write(content.charCodeAt(i))
		f.flush()
		f.close()

		delete f, fi

		return IOResult = errNoError
	} else
	if (IE)
	{
		/*@cc_on @*/
		/*@if (@_jscript_version>4)
			try
			{@end @*/
				var fso=new ActiveXObject("Scripting.FileSystemObject");
				var file=fso.CreateTextFile(path+name,1,false);
		/*@if (@_jscript_version>4)
			} catch (e)
			{
				return IOResult = errFileLocked
			};@end @*/
		/*@cc_off @*/

		file.Write(content)
		file.Close()
		return IOResult = errNoError
	};

};
function FileListObject()
{
	var path = arguments[0]
	var obj = sheval(arguments[1])
	var List = new Array(), j = 0;
	if (path == "")
	for (i in obj)
	List[j++] = ""+i
	return List
};

function FileListCookie(path)
{
	var Xnam = document.cookie.split(";"), List = new Array(), name, i
	for (i in Xnam)
	if (/\s*([^=]+)/.test(Xnam[i]))
	{
		if (RegExp.$1.length >= (len = path.length) &&
		path == RegExp.$1.substr(0,len))
		{
			name = RegExp.$1.substr(len);
			if (/^([^\/]+\/)/.test(name))
			{
				for (j = 0;j<List.length; j++)
				if (List[j] == RegExp.$1) break;
				if (RegExp.$1!="") List[j] = RegExp.$1
			} else
			if (name!="") List[List.length] = name
		};
	};
	return List;
};

function FileListExtended()
{
	var path = arguments[0];
	var disknum = arguments[1];
	var List = new Array(), j = 0;
	path = ((path=="" && !MZ && NC && Version<5) ? disknum : disknum+'/'+path).replace(/\//g,"\\")

	IOResult = errNoError;
	if (NC || OP)
	{
		netscape.security.PrivilegeManager.enablePrivilege('UniversalFileAccess')
		var fi=new java.io.File(path), fl
		if (!fi.canRead()) return IOResult = errNoAccess

		var Cont = fi.list()
		if (Cont == null) return IOResult = errNoAccess

		for (i in Cont)
		{
			fl = new java.io.File((new Array(path,Cont[i])).join("/"));
			List[j++] = Cont[i].toLowerCase() + (fl.isDirectory()?"/":"")

			delete fl
		}

		delete fi, Cont
		return List
				
	} else
	if (IE)
	{
		/*@cc_on
		@if (@_jscript_version>4)
			try
			{@end @*/
				var fso=new ActiveXObject("Scripting.FileSystemObject");
		/*@if (@_jscript_version>4)
			} catch (e)
			{
				return IOResult = errNoAccess;
			};@end
		if (/.:\\?$/.test(path) && !fso.DriveExists(path) ||
		!fso.FolderExists(path)) return IOResult = errNotFound;

		var folder = fso.GetFolder(path);
		var fc = new Enumerator(folder.SubFolders);
		for (; !fc.atEnd(); fc.moveNext())
		if (/([^\\]+)$/.test(fc.item()))
		List[j++] = RegExp.$1.toLowerCase()+"/";

		fc = new Enumerator(folder.files);

		for (; !fc.atEnd(); fc.moveNext())
		if (/([^\\]+)$/.test(fc.item()))
		List[j++] = RegExp.$1.toLowerCase();
		return List;
		@cc_off
		@*/
	} else
	return new Array();
};

function FileReadCookie(name) //, f
{
	IOResult = errNoError
	var prefix = name+'='
	var start = document.cookie.indexOf(prefix)
	if (start<0)
	if (FileExistsCookie(name),!IOResult) return ''
	else return IOResult = errNotFound
	var end = document.cookie.indexOf(';',start+prefix.length)
	if (end<0)
	end = document.cookie.length
	var out = document.cookie.substring(start+prefix.length,end)

	out = UnJZip(out,1)
	if (arguments[1]=='direct') return out

	if (out.c(0)=='#') return out.substr(2)
	return out
};

function FileReadObject(name,obj)
{
	IOResult = 0;
	var path = arguments[0];
	var obj = sheval(arguments[1]);
	for (var i in obj) if (name == i)
	return (((type=typeof(obj[i]))=="string" || type=="number" || type=="boolean")?(""+obj[i]):("["+type+"]"))
	return IOResult = errNotFound;
};

function FileReadExtended()
{
	var name = arguments[0]
	var disknum = arguments[1]

	name = name.replace(/\//g,"\\")

	if (/(.+\/)([^\/]+)$/.test(name))
	var path = '\\'+RegExp.$1,name = RegExp.$2; else var path = "\\"
	path = disknum+path

	IOResult = errNoError
	if (NC || OP)
	{
		netscape.security.PrivilegeManager.enablePrivilege('UniversalFileAccess')
		var fi=new java.io.File(path,name)
		if (!fi.canRead()) return IOResult = errNoAccess

		var f=new java.io.FileInputStream(fi);

		for (var fc='',i=f.available();i;i--) 
		fc+=String.fromCharCode(f.read())
		f.close()

		var jsfc = new String(fc)
		delete fc, f, fi

		return jsfc
		
	} else
	if (IE)
	{
		/*@cc_on @*/
		/*@if (@_jscript_version>4)
			try
			{@end @*/
				var fso=new ActiveXObject("Scripting.FileSystemObject");
				var file=fso.OpenTextFile(path+name,1,false);
		/*@if (@_jscript_version>4)
			} catch (e)
			{
				if (e.description=="Permission denied")
				return IOResult = errFileLocked
				return IOResult = errNotFound
			};@end @*/
		/*@cc_off @*/

		var out = file.Read(fso.GetFile(path+name).size)
		file.Close()
		return out
	};
	return IOResult = errFatalErr
};

// Exists section

function FileExistsObject(name,obj)
{
	if (name == "") return IOResult = errNoError

	obj = sheval(obj)
	for (var i in obj) if (name == ''+i) return IOResult = errNoError
	return IOResult = errNotFound
};

function FileExistsCookie(name)
{
	IOResult = errNoError
	if (name == "") return IOResult
	name = QuoteMeta(name)
	var reg1 = new RegExp("; *"+name+"[;=]"), reg2 = new RegExp("^"+name+"[;=]")
	var reg3 = new RegExp("; *"+name+"$"), reg4 = new RegExp("^"+name+"$")

	if (reg1.test(document.cookie) || reg2.test(document.cookie) ||
	reg3.test(document.cookie) || reg4.test(document.cookie)) return IOResult
	return IOResult = errNotFound
};

function FileExistsExtended()
{
	var name = arguments[0];
	var disknum = arguments[1];
	name = name.replace(/\//g,"\\");

	if (/(.+\/)([^\/]+)$/.test(name))
	var path = '\\'+RegExp.$1,name = RegExp.$2; else var path = "\\";
	path = disknum+path

	IOResult = errNoError;
	if (NC || OP)
	{
		netscape.security.PrivilegeManager.enablePrivilege('UniversalFileAccess');;
		var fi=new java.io.File(path,name)
		if (fi.exists()) return IOResult = errNoError

		delete fi
		return IOResult = errNotFound;
	
	} else
	if (IE)
	{
		/*@cc_on @*/
		/*@if (@_jscript_version>4)
			try
			{@end @*/
				var fso=new ActiveXObject("Scripting.FileSystemObject");
		/*@if (@_jscript_version>4)
			} catch (e)
			{
				return IOResult = errNotFound;
			};@end @*/
		/*@cc_off @*/
		if (fso.FileExists(path+name) || fso.FolderExists(path+name))
		return IOResult = errNoError;
		return IOResult = errNotFound;		
	};
	return IOResult = errFatalErr;
};

function FileDeleteObject(name,obj)
{
	FileExistsObject(name,obj)
	if (!IOResult) return IOResult = errNoAccess
	return IOResult
}

function FileDeleteCookie(name)
{
	FileExistsCookie(name)
	if (IOResult) return IOResult
	if (IE)
	document.cookie=name+'=;expires=Wednesday, 01-Jan-1970 00:00:00 GMT'; else
	document.cookie=name+'=#%3F;expires=Wednesday, 01-Jan-70 00:00:00 GMT'
	return IOResult = errNoError
}

function FileDeleteExtended()
{
	var name = arguments[0];
	var disknum = arguments[1];

	name = name.replace(/\//g,"\\");

	if (/(.+\/)([^\/]+)$/.test(name))
	var path = '\\'+RegExp.$1,name = RegExp.$2; else var path = "\\";
	path = disknum+path;

	if (DelConf && !confirm("File "+path+name+" will deleted!"))
	return IOResult = errNoAccess

	FileExistsExtended(name,disknum)
	if (IOResult) return IOResult
	IOResult = errNoError
	if (NC || OP)
	{
		return IOResult = errNoError
	} else
	if (IE)
	{
		/*@cc_on @*/
		/*@if (@_jscript_version>4)
			try
			{@end @*/
				var fso=new ActiveXObject("Scripting.FileSystemObject");
		/*@if (@_jscript_version>4)
			} catch (e)
			{
				return IOResult = errNotFound
			};@end @*/
		/*@cc_off @*/

		if (/(.*)\\$/.test(name)) fso.DeleteFolder(path+RegExp.$1,true); else
		fso.DeleteFile(path+name,true)

		return IOResult = errNoError
	};
	return IOResult = errFatalErr;
};

function FileSizeObject()
{
	var name = arguments[0];
	var obj = arguments[1];
	if (name=="") return 0;
	return FileReadObject(name,obj).length;
};

function FileSizeCookie(name)
{
	if (name=="") return 0;
	var content = FileReadCookie(name)
	if (!IOResult) return content.length; else return 0;
};

function FileSizeExtended(name,disknum)
{
	var name = arguments[0]
	var disknum = arguments[1];
	if (name=="") return 0
	FileExistsExtended(name,disknum);
	if (IOResult) return 0
	name = name.replace(/\//g,"\\");
	if (/(.+\/)([^\/]+)$/.test(name))
	var path = '\\'+RegExp.$1,name = RegExp.$2; else var path = "\\"
	path = disknum+path;

	IOResult = errNoError
	if (NC || OP)
	{
		netscape.security.PrivilegeManager.enablePrivilege('UniversalFileAccess')
		var fi=new java.io.File(path,name)
		var jsfl = new String(fi.length())
		delete fi

		return jsfl
	
	} else
	if (IE)
	{
		/*@cc_on @*/
		/*@if (@_jscript_version>4)
			try
			{@end @*/
				var fso=new ActiveXObject("Scripting.FileSystemObject")
		/*@if (@_jscript_version>4)
			} catch (e)
			{
				return IOResult = errNotFound;
			};@end @*/
		/*@cc_off @*/

		if (/(.*)\\$/.test(name)) return (path+name).length; else
		return fso.GetFile(path+name).size;
	};
	return IOResult = errFatalErr;
};

function FileAccessObject(name)
{
	if (name=="") return "dr-x";
	return "-r--";
};

function FileAccessCookie(name)
{
	var content, ch
	if (name=="") return "drwx"

	if (/\/$/.test(name)) return "drwx"; else
	{
		content = FileReadCookie(name, 'direct')
		if (IOResult || content.c(0)!="#") return "-rw-"
		ch = content.charCodeAt(1)

		return (ch&4?'M':'-')+(ch&1?'r':'-')+(ch&2?'w':'-')+(ch&8?'x':'-')
	}
};

function FileAccessExtended(name,disk)
{
	IOResult = errNoError

	if (name == "") return "drwx"
	var fullname = (disk+"/"+name).replace(/\//g,"\\")
	if (fullname.l() == "\\") fullname = fullname.slice(0,-1)

	if (IE)
	{
		/*@cc_on
		@if (@_jscript_version>4)
		try
		{@end @*/
			var fso = new ActiveXObject("Scripting.FileSystemObject")
		/*@if (@_jscript_version>4)
		} catch (e)
		{
			return IOResult = errNoAccess
		}@end
		@cc_off @*/

		if (fso.FolderExists(fullname))	var attr = fso.GetFolder(fullname); else
		if (fso.FileExists(fullname)) var attr = fso.GetFile(fullname); else
		return IOResult = errNotFound

		attr = attr.attributes

		return (attr & 16 ? 'd':'-')+(attr & 1 ? '-':'r')+(attr & 6 ? '-':'w')+
		(attr & 32 ? '-' : 'x')
	} else

	if (NC || OP)
	{
		netscape.security.PrivilegeManager.enablePrivilege('UniversalFileAccess')
		var fi=new java.io.File(fullname)

		if (fi.isDirectory()) return "drwx"
		if (fi.isFile()) return "-rwx"
		IOResult = errNotFound

		delete fi
		return "-rwx" // NC 5.x & NC 6.x java bug
	} else
	return ""
};

function FileMkdirExtended(path)
{
	if (DelConf && !confirm("Folder "+path+" will created!"))
	return IOResult = errNoAccess;

	if (IE)
	{
		/*@cc_on
		@if (@_jscript_version>4)
		try
		{@end @*/
			var fso=new ActiveXObject("Scripting.FileSystemObject");
		/*@if (@_jscript_version>4)
		} catch (e)
		{
			return IOResult = errNoAccess;
		};@end
		@cc_off @*/

		Path = path.split("\\"),
		path = Path[0];

		for (i = 1;i<Path.length;i++)
		{
			path += "\\"+Path[i];
			if (!fso.FolderExists(path))
			fso.CreateFolder(path)
		};
		return IOResult = errNoError;
	} else
	if (NC || OP)	
	{
		netscape.security.PrivilegeManager.enablePrivilege('UniversalFileAccess');;
		var fi=new java.io.File(path)
		fi.mkdirs();

		delete fi
		return IOResult = errNoError
	};
};

function fappend(name,content)
{
	var old = fget(name)
	if (IOResult) old = ""
	fput(name,old+content)
	return IOResult
};

function UniqFile()
{
	var name = "/lost+found/file";
	for (i = 0;LocalExists(name+i),!IOResult;i++);
	return name+i;
};

// Удаление элемента массива
function DeleteItem(m,r)
{
	var Out=new Array(),i,j
	for (j=i=0;i<m.length;i++) if (i!=r) Out[j++]=m[i];
	return Out;
};

// Проверка существования директория (локально)
function LocalDirEi(path)
{
	path = FullPath(path)
	for (i in Names)
	{
		var re = new RegExp("^"+QuoteMeta(path))
		if (re.test(Names[i])) return IOResult = errNoError, i
	}
	return IOResult = errNotFound
}

function favail(obj,parm)
{
	return sheval("FileAvail"+obj+"('"+parm+"')")
}

function FileAvailObject(obj)
{
	return new Array("-",0)
}

function FileAvailCookie()
{
	var len = document.cookie.length
	return new Array(len,4096-len)
}

function FileAvailExtended(disk)
{
	if (NC || OP)
	{
		return new Array("-","-")
	} else
	if (IE)
	{
		/*@cc_on @*/
		/*@if (@_jscript_version>4)
			try
			{@end @*/
				var fso = new ActiveXObject("Scripting.FileSystemObject");
				var disk = fso.GetDrive(disk.substr(0,1))
		/*@if (@_jscript_version>4)
			} catch (e)
			{
				IOResult = errNotFound
				return new Array("-","-")
			};@end @*/
		/*@cc_off @*/

		var size = disk.TotalSize
		return new Array(size - disk.FreeSpace, size)
	};
	return IOResult = errFatalErr

}

function Jenc (s)
{
	s = parseInt(s,10)
	if (s>51) s = (s+"").lz(2); else
	{
		if ((s+= 65)>90) s+= 6
		s = CODES.charAt(s)
	}
	return s
}

function JZip (str, f, b)
{
	str = str.replace(/\*/g,'*+')
	var Dict  = new Array ()
	var Words = str.split (/[^\wа-яА-Я0-9:]+/),l1,l2,i,j,r
	var Word  = new Array()
	var Freq  = new Array ()

	Words = Words.concat (new Array('tion','ternal')).sort(new Function("a,b", "return a.length-b.length"))

	if (f) for (i = 0; i<Words.length; i++)
	Words[i] = escape (Words[i])

	for (r = 0; r<Words.length; r++)
	if (Words[r].length>b) break

	Words = Words.slice (r).sort(new Function ("a,b", "return a==b? 0 : (a>b?1:-1)"))

	for (i = 0; i<Words.length; i++)
	{
		r = Words[i], j = 1
		for (i++; r == Words[i]; i++, j++);

		Freq[Word.length] = j
		Word[Word.length] = r
	}

	delete Words

	if (f) str = escape (str.replace(/ /g,'*_').replace(/\n/,'*-').replace(/\t/g,'*.'))
	for (i = j = 0; i<Math.min(152,Freq.length); i++)
	if (Freq[i]>1)
	{
		r   = new RegExp (Word[i],"g")
		if (r.test(str))
		{
			str = str.replace (r, '*'+Jenc(j))
			Dict[j++] = Word[i]
		}
	}

	delete Freq

	return Dict.join (",")+"!"+str
}

function UnJZip (str, f)
{
	if (f)
	str = unescape (str).replace(/\*_/g,' ').replace(/\*\-/g,"\n").replace(/\*\./g,'	')

	var t = str.indexOf("!")
	var Dict = str.substr (0, t).split (",")
	var txt  = str.substr (t+1), i, r

	for (i in Dict)
	{
		if ((r = Jenc (i))!=i) r = "("+(""+i).lz(2)+"|"+r+")"; else
		r = (""+i).lz(2)
		r = new RegExp ("\\*"+r,"g")
		txt = txt.replace (r, Dict[i])
	}
	return txt.replace(/\*\+/g,'*')
}

function FileChmodCookie(name,r)
{
	if (name=='') return errCantChmod

	r = String.fromCharCode(48+(r.m('r')?1:0)+(r.m('w')?2:0)+(r.m('x')?8:0))
	var content = FileReadCookie(name)
	if (IOResult) return IOResult

	FileWriteCookie (name, '#'+r+content, 'direct')
	if (IOResult) return IOResult
	return errNoError
}

function FileChmodObject()
{
	return errCantChmod
}

function FileChmodExtended(name, r, disk)
{
	IOResult = errNoError

	if (name == "") return "drwx"
	var fullname = (disk+"/"+name).replace(/\//g,"\\")
	if (fullname.l() == "\\") fullname = fullname.slice(0,-1)

	if (IE)
	{
		/*@cc_on
		@if (@_jscript_version>4)
		try
		{@end @*/
			var fso = new ActiveXObject("Scripting.FileSystemObject")
		/*@if (@_jscript_version>4)
		} catch (e)
		{
			return IOResult = errNoAccess
		}@end
		@cc_off @*/

		if (fso.FolderExists(fullname))	var file = fso.GetFolder(fullname); else
		if (fso.FileExists(fullname)) var file = fso.GetFile(fullname); else
		return IOResult = errNotFound

		file.attributes = (r.m('r')?0:1)+(r.m('w')?0:6)+(r.m('x')?0:32)
		return errNoError		
	}

	return errCantChmod
}