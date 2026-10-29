# Builds an Artifact-ready copy of concepts/r86/home.html: head/body stripped, ../../ assets mapped to local files.
import re, os, shutil, json
H='/home/user/xyphre1314/hookworthy'; D=os.path.dirname(os.path.abspath(__file__)); out_dir=f'{D}/home'
s=open(f'{H}/concepts/r86/home.html',encoding='utf-8').read()
head=re.search(r'<head[^>]*>(.*?)</head>',s,re.S|re.I).group(1)
bm=re.search(r'<body([^>]*)>(.*)</body>',s,re.S|re.I); battrs,body=bm.group(1),bm.group(2)
head=re.sub(r'<title>.*?</title>|<meta[^>]*>|<link[^>]*rel="(?:apple-touch-icon|canonical)"[^>]*>','',head,flags=re.S|re.I)
out='<title>Hookworthy Home</title>\n'+head.strip()+'\n'
attrs=dict(re.findall(r'([\w-]+)="([^"]*)"',battrs))
if attrs: out+='<script>'+''.join(f'document.body.setAttribute({json.dumps(k)},{json.dumps(v)});' for k,v in attrs.items())+'</script>\n'
out+=body.strip()+'\n'; files={}
def rel(m):
    p=m.group(1)
    pub = 'core.js' if p=='core.js' else p.replace('assets/people/','people/').replace('assets/brand/','brand/')
    files[pub]=f'{H}/{p}'; return pub
out=re.sub(r'\.\./\.\./((?:fonts|assets/people|assets/brand)/[\w.\-]+|core\.js)',rel,out)
out=out.replace('href="../../index.html#legal"','href="https://claude.ai/artifact/U91RtwmxGET54EqnSh3hSD#legal" target="_blank" rel="noopener"')
for pub,src in files.items():
    os.makedirs(os.path.dirname(f'{out_dir}/{pub}') or out_dir,exist_ok=True); shutil.copyfile(src,f'{out_dir}/{pub}')
open(f'{out_dir}/index.html','w',encoding='utf-8').write(out)
json.dump({k:k for k in files},open(f'{out_dir}/files.json','w'))
print(len(out)//1024,'KB',json.dumps({k:k for k in files}))
left=re.findall(r'\.\./\.\./[^"\' )]*',out); print('left', sorted(set(left)))
