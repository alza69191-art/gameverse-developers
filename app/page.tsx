"use client";

import { useCallback, useEffect, useState } from "react";

type User = { id:string; email:string; displayName:string; role:string };
type Application = { id:number; studioName:string; status:string; reviewNotes:string|null; createdAt:string };
type Upload = { id:string; title:string; slug:string; filename:string; sizeBytes:number; uploadStatus:string; scanStatus:string; reviewStatus:string; reviewNotes:string|null };

export default function Home() {
  const [user,setUser]=useState<User|null>(null);
  const [mode,setMode]=useState<"login"|"register">("register");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [application,setApplication]=useState<Application|null>(null);
  const [uploads,setUploads]=useState<Upload[]>([]);
  const [studio,setStudio]=useState(""); const [contact,setContact]=useState(""); const [portfolio,setPortfolio]=useState(""); const [bio,setBio]=useState("");
  const [title,setTitle]=useState(""); const [slug,setSlug]=useState(""); const [description,setDescription]=useState(""); const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");

  const load=useCallback(async()=>{
    const me=await fetch("/api/v1/auth/me",{cache:"no-store"}).then(r=>r.json());
    setUser(me.user??null);
    if(!me.user)return;
    const app=await fetch("/api/v1/developer/apply",{cache:"no-store"}).then(r=>r.json());
    setApplication(app.application??null);
    if(me.user.role==="developer"||me.user.role==="admin"){
      const data=await fetch("/api/v1/developer/uploads/mine",{cache:"no-store"}).then(r=>r.json());
      setUploads(data.uploads??[]);
    }
  },[]);
  useEffect(()=>{load().catch(()=>setMessage("تعذر الاتصال بالخادم"));},[load]);

  async function auth(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{
      const endpoint=mode==="register"?"/api/v1/auth/register":"/api/v1/auth/login";
      const body=mode==="register"?{displayName:name,email,password}:{email,password};
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await r.json();if(!r.ok)throw new Error(data.error||"تعذر إتمام العملية");
      await load();
    }catch(e){setMessage(e instanceof Error?e.message:"حدث خطأ");}finally{setBusy(false);}
  }

  async function apply(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/v1/developer/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studioName:studio,contactEmail:contact,portfolioUrl:portfolio,description:bio})});
      const data=await r.json();if(!r.ok)throw new Error(data.error||"تعذر إرسال الطلب");
      await load();setMessage("تم إرسال طلبك للإدارة بنجاح.");
    }catch(e){setMessage(e instanceof Error?e.message:"حدث خطأ");}finally{setBusy(false);}
  }

  async function uploadGame(e:React.FormEvent){
    e.preventDefault();if(!file){setMessage("اختر ملف ZIP أولاً");return;}
    setBusy(true);setMessage("");
    try{
      const init=await fetch("/api/v1/developer/uploads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:file.name,size:file.size,contentType:file.type||"application/octet-stream",title,slug,description})});
      const data=await init.json();if(!init.ok)throw new Error(data.error||"تعذر بدء الرفع");
      const sent=await fetch(data.uploadUrl,{method:"PUT",headers:data.headers,body:file});
      if(!sent.ok)throw new Error("فشل رفع الملف إلى التخزين. تحقق من إعداد CORS لحاوية R2.");
      const done=await fetch(`/api/v1/developer/uploads/${data.uploadId}/complete`,{method:"POST"});
      const completed=await done.json();if(!done.ok)throw new Error(completed.error||"تعذر تأكيد الرفع");
      setFile(null);setTitle("");setSlug("");setDescription("");await load();setMessage("تم استلام اللعبة في الحجر بانتظار الفحص الأمني والمراجعة.");
    }catch(e){setMessage(e instanceof Error?e.message:"حدث خطأ أثناء الرفع");}finally{setBusy(false);}
  }

  async function logout(){await fetch("/api/v1/auth/logout",{method:"POST"});setUser(null);setApplication(null);setUploads([]);}

  return <main className="shell">
    <header className="top"><a className="brand" href="/">GAMEVERSE <span>DEVELOPERS</span></a><div>{user?<><span className="user">{user.displayName}</span><button className="outline" onClick={logout}>خروج</button></>:<span className="badge">بوابة المطورين</span>}</div></header>
    <section className="hero"><div className="eyebrow">BUILD · SUBMIT · GROW</div><h1>حوّل لعبتك إلى تجربة تصل للاعبين</h1><p>قدّم لعبتك، تابع حالة الفحص والمراجعة، وأدر إصداراتك من بوابة المطورين المستقلة.</p></section>
    {message&&<div className="notice">{message}</div>}
    {!user?<section className="panel auth"><div className="tabs"><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>إنشاء حساب</button><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>تسجيل الدخول</button></div><form onSubmit={auth}>
      {mode==="register"&&<label>الاسم الظاهر<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>}
      <label>البريد الإلكتروني<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>كلمة المرور<input type="password" required minLength={mode==="register"?10:1} autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button className="primary" disabled={busy}>{busy?"جارٍ التنفيذ...":mode==="register"?"إنشاء حساب لاعب":"دخول"}</button>
    </form><p className="muted">إنشاء الحساب يبدأ بصلاحية لاعب. يمكنك طلب اعتماد حساب مطوّر بعد تسجيل الدخول.</p></section>:user.role==="player"&&!application?<section className="panel"><h2>طلب اعتماد مطوّر</h2><p className="muted">قدّم بيانات الاستوديو وروابط أعمالك. لن تتاح أدوات الرفع قبل موافقة الإدارة.</p><form onSubmit={apply}>
      <label>اسم الاستوديو أو المطوّر<input required minLength={2} maxLength={160} value={studio} onChange={e=>setStudio(e.target.value)}/></label>
      <label>بريد التواصل<input type="email" required value={contact} onChange={e=>setContact(e.target.value)}/></label>
      <label>رابط معرض الأعمال (اختياري)<input type="url" value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="https://"/></label>
      <label>نبذة عن خبرتك وألعابك<textarea required minLength={40} maxLength={5000} rows={5} value={bio} onChange={e=>setBio(e.target.value)}/></label>
      <button className="primary" disabled={busy}>إرسال طلب الاعتماد</button>
    </form></section>:user.role==="player"&&application?<section className="panel"><h2>طلب المطوّر قيد المراجعة</h2><p>الاستوديو: {application.studioName}</p><div className="status">{application.status==="pending"?"بانتظار مراجعة الإدارة":application.status==="rejected"?"تم رفض الطلب":"تم اعتماد الطلب"}</div>{application.reviewNotes&&<p className="muted">{application.reviewNotes}</p>}<button className="outline" onClick={load}>تحديث الحالة</button></section>:user.role==="developer"||user.role==="admin"?<>
      <section className="panel"><div className="panel-head"><div><h2>إرسال إصدار لعبة</h2><p className="muted">النسخة الحالية تقبل أرشيف ZIP حتى 200 ميغابايت، للتنزيل بعد الفحص والموافقة.</p></div><span className="status">حساب معتمد</span></div><form onSubmit={uploadGame}>
        <label>اسم اللعبة<input required minLength={3} maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></label>
        <label>معرّف اللعبة بالإنجليزية<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} value={slug} onChange={e=>setSlug(e.target.value)} placeholder="my-awesome-game"/></label>
        <label>وصف اللعبة<textarea required minLength={30} maxLength={10000} rows={4} value={description} onChange={e=>setDescription(e.target.value)}/></label>
        <label>ملف اللعبة ZIP<input type="file" accept=".zip,application/zip" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
        {file&&<p className="muted">الملف المحدد: {file.name} · {(file.size/1024/1024).toFixed(1)} MB</p>}
        <button className="primary" disabled={busy}>{busy?"جارٍ الرفع...":"رفع وإرسال للمراجعة"}</button>
      </form></section>
      <section className="panel"><div className="panel-head"><h2>إصداراتي وطلباتي</h2><button className="outline" onClick={load}>تحديث</button></div>{uploads.length===0?<p className="muted">لم ترفع ألعاباً بعد.</p>:uploads.map(u=><article className="upload" key={u.id}><div><h3>{u.title}</h3><p className="muted">{u.filename} · {(u.sizeBytes/1024/1024).toFixed(1)} MB</p></div><div className="states"><span>الرفع: {u.uploadStatus}</span><span>الفحص: {u.scanStatus}</span><span>المراجعة: {u.reviewStatus}</span></div>{u.reviewNotes&&<p className="muted">{u.reviewNotes}</p>}</article>)}</section>
    </>:<section className="panel"><h2>هذا الحساب لا يملك صلاحية المطوّر.</h2></section>}
    <footer><span>GameVerse Developers</span><span>لا يُنشر أي ملف قبل اجتياز الفحص الأمني وموافقة الإدارة.</span></footer>
  </main>;
}
