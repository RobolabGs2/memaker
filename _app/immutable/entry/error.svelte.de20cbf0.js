import{S,i as q,s as x,e as b,d as _,f as j,h as d,j as g,k as h,l,m as k,o as m,p as v,q as $,n as E,r as y}from"../chunks/index.773389e6.js";import{s as C}from"../chunks/singletons.36e75eb9.js";const H=()=>{const s=C;return{page:{subscribe:s.page.subscribe},navigating:{subscribe:s.navigating.subscribe},updated:s.updated}},P={subscribe(s){return H().page.subscribe(s)}};function w(s){var f;let t,r=s[0].status+"",o,n,i,p=((f=s[0].error)==null?void 0:f.message)+"",u;return{c(){t=b("h1"),o=_(r),n=j(),i=b("p"),u=_(p)},l(e){t=d(e,"H1",{});var a=g(t);o=h(a,r),a.forEach(l),n=k(e),i=d(e,"P",{});var c=g(i);u=h(c,p),c.forEach(l)},m(e,a){m(e,t,a),v(t,o),m(e,n,a),m(e,i,a),v(i,u)},p(e,[a]){var c;a&1&&r!==(r=e[0].status+"")&&$(o,r),a&1&&p!==(p=((c=e[0].error)==null?void 0:c.message)+"")&&$(u,p)},i:E,o:E,d(e){e&&l(t),e&&l(n),e&&l(i)}}}function z(s,t,r){let o;return y(s,P,n=>r(0,o=n)),[o]}let D=class extends S{constructor(t){super(),q(this,t,z,w,x,{})}};export{D as default};
