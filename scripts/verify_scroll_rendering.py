"""Regression check for scroll-time canvas resets and the computer rear route.

Run against the local HTTP preview with Python's Playwright package installed:
    python3 scripts/verify_scroll_rendering.py
Optional: PREVIEW_URL=http://127.0.0.1:4173 QA_LABEL=after
The frame timings are software-WebGL diagnostics, not hardware FPS claims.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / 'artifacts/design-qa/scroll-fix'
OUT.mkdir(parents=True, exist_ok=True)
checks = []

def check(name, condition):
    assert condition, name
    checks.append(name)

INSTRUMENT = '''
window.scrollMetrics = {resizes:[], frames:[], shadowDraws:0, draws:0};
for (const key of ['width','height']) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,key);
  Object.defineProperty(HTMLCanvasElement.prototype,key,{
    ...descriptor,
    set(value) {
      if (this.closest?.('#studio')) scrollMetrics.resizes.push({key,value});
      return descriptor.set.call(this,value);
    }
  });
}
const bind = WebGL2RenderingContext.prototype.bindFramebuffer;
WebGL2RenderingContext.prototype.bindFramebuffer = function(target,buffer) {
  this.qaFramebuffer = buffer;
  return bind.call(this,target,buffer);
};
for (const key of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) {
  const draw = WebGL2RenderingContext.prototype[key];
  WebGL2RenderingContext.prototype[key] = function(...args) {
    scrollMetrics.draws++;
    if (this.qaFramebuffer) scrollMetrics.shadowDraws++;
    return draw.apply(this,args);
  };
}
'''

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--enable-unsafe-swiftshader','--disable-webgpu'])
    errors = []
    results = {}
    for name, width, height, density in [('desktop',1440,1000,1),('mobile',390,844,2)]:
        page = browser.new_page(viewport={'width':width,'height':height},device_scale_factor=density)
        page.add_init_script(INSTRUMENT)
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173'),wait_until='networkidle')
        page.wait_for_selector('#studio[data-ready="true"]')
        page.wait_for_timeout(2200)
        metrics = page.evaluate('''async () => {
          const m=scrollMetrics;m.resizes=[];m.frames=[];m.draws=0;m.shadowDraws=0;
          const end=(document.querySelector('.hero-track').offsetHeight-innerHeight)*.14;
          let previous=performance.now();
          await new Promise(resolve=>{let i=0;function tick(t){
            m.frames.push(t-previous);previous=t;
            scrollTo({top:end*(i/90),behavior:'instant'});
            if(i++<90) requestAnimationFrame(tick);else resolve();
          }requestAnimationFrame(tick);});
          return m;
        }''')
        check(f'{name}: early scroll never resets the drawing buffer',not metrics['resizes'])
        check(f'{name}: camera travel reuses static shadows',metrics['shadowDraws']==0)
        check(f'{name}: scrolling renders the scene',metrics['draws']>0)
        page.wait_for_function('Math.abs(Number(document.querySelector("#studio").dataset.progress)-.14)<.0003')
        page.screenshot(path=str(OUT/f'{name}-checked-hub.png'))
        frames=sorted(metrics['frames'])
        metrics['frameSummary']={'count':len(frames),'mean':sum(frames)/len(frames),'p95':frames[int(len(frames)*.95)]}
        results[name]=metrics
        page.evaluate('scrollMetrics.draws=0')
        page.wait_for_timeout(350)
        check(f'{name}: settled scene does not redraw',page.evaluate('scrollMetrics.draws')==0)
        page.evaluate('scrollTo({top:.26*(document.querySelector(".hero-track").offsetHeight-innerHeight),behavior:"instant"})')
        page.wait_for_function('Math.abs(Number(document.querySelector("#studio").dataset.progress)-.26)<.0003')
        route=page.evaluate('''async () => {
          const j=await import('./journey.js');const THREE=await import('three');
          const eye=new THREE.Vector3(),target=new THREE.Vector3();j.sampleJourney(.26,eye,target);
          const endpoint=j.hubComputerRoute.at(-1),port=j.computerPorts.network;
          return {endpoint,port,eye:eye.toArray(),target:target.toArray(),
            continuous:JSON.stringify(endpoint)===JSON.stringify(j.computerKeyboardRoute[0]),
            usb:j.computerKeyboardRoute.some(point=>JSON.stringify(point)===JSON.stringify(j.computerPorts.usb.cable))};
        }''')
        check(f'{name}: hub signal terminates at rear network connector',route['endpoint']==route['port']['cable'] and route['endpoint'][2]<-1.995)
        check(f'{name}: computer is viewed from behind',route['eye'][2]<route['target'][2])
        check(f'{name}: onward signal is continuous and exits rear USB',route['continuous'] and route['usb'])
        page.screenshot(path=str(OUT/f'{name}-checked-rear.png'))
        page.evaluate('scrollTo({top:.065*(document.querySelector(".hero-track").offsetHeight-innerHeight),behavior:"instant"})')
        page.wait_for_function('Math.abs(Number(document.querySelector("#studio").dataset.progress)-.065)<.0003')
        page.locator('#motion-toggle').click()
        page.wait_for_timeout(200)
        camera=page.locator('#studio').get_attribute('data-camera')
        opacity=page.locator('.hero-copy').evaluate('(e)=>e.style.opacity')
        hide=page.add_style_tag(content='.header,.hero-copy,.chapter-copy,.hero-bottom,.scroll-progress{visibility:hidden!important}')
        image=page.locator('#studio canvas').screenshot(path=str(OUT/f'{name}-paused-before.png'))
        page.evaluate('scrollTo({top:.14*(document.querySelector(".hero-track").offsetHeight-innerHeight),behavior:"instant"})')
        page.wait_for_timeout(300)
        after_image=page.locator('#studio canvas').screenshot(path=str(OUT/f'{name}-paused-after.png'))
        hide.evaluate('(e)=>e.remove()')
        check(f'{name}: early pause freezes camera, view and text',camera==page.locator('#studio').get_attribute('data-camera') and opacity==page.locator('.hero-copy').evaluate('(e)=>e.style.opacity') and image==after_image)
        page.locator('#motion-toggle').click()
        page.wait_for_function('Math.abs(Number(document.querySelector("#studio").dataset.progress)-.14)<.0003')
        check(f'{name}: resume reaches current scroll position',page.locator('#studio').get_attribute('data-stage')=='hub')
        if name == 'desktop':
            page.evaluate('scrollTo({top:.38*(document.querySelector(".hero-track").offsetHeight-innerHeight),behavior:"instant"})')
            page.wait_for_function('Math.abs(Number(document.querySelector("#studio").dataset.progress)-.38)<.0003')
            page.evaluate('scrollMetrics.shadowDraws=0')
            page.mouse.move(700,500)
            page.wait_for_timeout(700)
            check('Instanced keys retain picking and refresh hover shadows',page.locator('#studio').evaluate('(e)=>e.style.cursor')=='pointer' and page.evaluate('scrollMetrics.shadowDraws')>0)
            previous=page.locator('#studio-announcement').inner_text()
            page.mouse.click(700,500)
            check('Instanced keyboard still switches the monitor screen',previous!=page.locator('#studio-announcement').inner_text())
        page.evaluate('scrollMetrics.resizes=[]')
        page.set_viewport_size({'width':width+80,'height':height+40})
        page.wait_for_timeout(400)
        check(f'{name}: real viewport resize still updates the canvas',bool(page.evaluate('scrollMetrics.resizes')))
        page.close()
    check('No JavaScript errors',not errors)
    browser.close()
report={'passed':len(checks),'checks':checks,'metrics':results,'console_errors':errors}
(OUT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(checks),'checks':checks,'metrics':{name:{'canvas_dimension_writes':len(m['resizes']),'draws':m['draws'],'shadowDraws':m['shadowDraws'],'frameSummary':m['frameSummary']} for name,m in results.items()}},ensure_ascii=False,indent=2))
