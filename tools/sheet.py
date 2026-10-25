import plistlib,re,sys
from PIL import Image,ImageDraw
def frames(plist):
    p=plistlib.load(open(plist,'rb'));img=Image.open(plist.replace('.plist','.png')).convert('RGBA')
    out={}
    for k,v in p['frames'].items():
        nums=list(map(float,re.findall(r'-?[\d.]+',v['frame'])));x,y,w,h=map(int,nums)
        rot=v.get('rotated',False)
        if rot: c=img.crop((x,y,x+h,y+w)).rotate(90,expand=True)
        else: c=img.crop((x,y,x+w,y+h))
        sw,sh=map(int,map(float,re.findall(r'-?[\d.]+',v['sourceSize'])))
        scr=list(map(int,map(float,re.findall(r'-?[\d.]+',v['sourceColorRect']))))
        full=Image.new('RGBA',(sw,sh));full.paste(c,(scr[0],scr[1]));out[k]=full
    return out
if __name__=='__main__':
    fr=frames(sys.argv[1]); pre=sys.argv[3] if len(sys.argv)>3 else ''
    keys=sorted([k for k in fr if k.startswith(pre)],key=lambda k:[int(x) if x.isdigit() else x for x in re.split(r'(\d+)',k)])
    cols=10;W=max(f.size[0] for f in fr.values())+10;H=max(f.size[1] for f in fr.values())+20
    sheet=Image.new('RGBA',(cols*W,((len(keys)+cols-1)//cols)*H),(255,0,255,255));d=ImageDraw.Draw(sheet)
    for i,k in enumerate(keys):
        x=(i%cols)*W;y=(i//cols)*H;sheet.paste(fr[k],(x,y+15),fr[k]);d.text((x+2,y+1),k,fill=(0,0,0))
    sheet.save(sys.argv[2])
