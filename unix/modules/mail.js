// Заглушка
function SetLogin(user, pass)
{
	SetVar("user",user)
}

// Перейти к... (в объекте mail)
function Navi()
{
	dtime = ping?(new Date()-0):0	// для команды ping

	with(document)
	if (NaviStack.length)
	{
		for (i = 10; i && images["navi"+curnavi].busy; i--)
		if (++curnavi>9) curnavi = 0

		if (!images["navi"+curnavi].busy)
		{
			images["navi"+curnavi].busy = true
			images["navi"+curnavi].onerror = new Function("x","NaviFree("+curnavi+","+dtime+")")
			images["navi"+curnavi].src = NaviStack.pop()
		}
	}
}

// Поставить в очередь
function SetNavi(url)
{
	NaviStack.unshift(url+(ping?'/%00?'+Math.random():''))
	Navi()
}

function NaviFree(num, dtime)
{
	if (document.images && document.images["navi"+num])
	{
		document.images["navi"+num].busy = false
		if (/^http:\/\/([^\/]+)/.test(host = document.images["navi"+num].src)) host = RegExp.$1
		if (dtime)
		{
			dtime = new Date()-dtime
			if (dtime>pingto) Type('Request timed out.\n'); else
			Type('64 bytes from '+host+': time='+dtime+' msec\n')
		}

		if (--ping<0)
		{
			ping = dialog = 0
			Type(P())
		} else SetNavi('http://'+host)
	}
}

// Проверка на глючные браузеры

function NaviCheckBrowser() // 1 <= bad
{
	if (NC && Version>=5) return 1
	if (MZ)
	{
		var Aver = Version.split (".")
		if (Aver[1]<9 || Aver[1]==9 && Aver[2]<6)
		return 1
	}
	return 0
}