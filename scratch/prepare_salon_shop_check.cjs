const fs=require('fs');
let s=fs.readFileSync('scratch/verify_salon_v10.cjs','utf8');
s=s.replace('await page.waitForTimeout(400);',`await page.waitForTimeout(400);
    await page.evaluate(()=>salon.request('styles'));
    await page.waitForFunction(()=>salon.styleShop.dialog.open);
    assert.equal(await page.locator('.salon-style-card').count(),6);
    assert.equal(await page.locator('.salon-style-shop').getByText('내 스타일',{exact:true}).count(),0);
    assert.equal(await page.locator('[data-style="dog"],[data-style="black-cat"]').count(),0);
    assert.ok(await page.locator('.salon-purchase button').isDisabled());
    assert.ok(await page.evaluate(()=>!salon.active()));
    for(const id of ['red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']) {
      await page.click('[data-style="'+id+'"]');
      for(const mode of ['idle','walk','sit','carry']) {
        await page.click('[data-motion="'+mode+'"]');
        for(let d=0;d<4;d++)await page.click('[data-turn="1"]');
      }
    }
    await page.click('[data-style="red-fox"]');await page.click('[data-motion="idle"]');
    await page.screenshot({path:'output/salon-skin-shop-ui/game-purchase-desktop.png'});
    await page.setViewportSize({width:600,height:850});
    assert.ok(await page.evaluate(()=>{const d=salon.styleShop.dialog;return d.scrollWidth<=d.clientWidth+1;}));
    await page.screenshot({path:'output/salon-skin-shop-ui/game-purchase-mobile.png'});
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(()=>!salon.styleShop.dialog.open&&salon.isOpen&&salon.active()));
    await page.setViewportSize({width:1536,height:1080});
    await page.evaluate(()=>salon.open());
`);
fs.writeFileSync('scratch/verify_salon_shop.cjs',s);
