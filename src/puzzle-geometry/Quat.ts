// We need a quaternion class.  We use this to represent rotations,
// planes, and points.

export class Quat {
   public static eps = 1e-9 ;
   public static expandfaces(rots: Quat[], faces: Quat[][]): Quat[][] {
      // given a set of faces, expand by rotation set
      let nfaces = [] ;
      for (let i = 0; i < rots.length; i++) {
         for (let k = 0; k < faces.length; k++) {
            let face = faces[k] ;
            let nface = [] ;
            for (let j = 0; j < face.length; j++) {
               nface.push(face[j].rotateplane(rots[i])) ;
            }
            nfaces.push(nface) ;
         }
      }
      return nfaces ;
   }
   public static centermassface(face: Quat[]): Quat {
      // calculate a center of a face by averaging points
      let s = new Quat(0, 0, 0, 0) ;
      for (let i = 0; i < face.length; i++) {
         s = s.sum(face[i]) ;
      }
      return s.smul(1.0 / face.length) ;
   }
   public static random(): Quat { // generate a random quat
      let q = new Quat(Math.random() * 2 - 1, Math.random() * 2 - 1,
                       Math.random() * 2 - 1, Math.random() * 2 - 1) ;
      return q.smul(1 / q.len()) ;
   }
   public a: number; public b: number; public c: number; public d: number;
   constructor(a_: number, b_: number, c_: number, d_: number) {
      this.a = a_ ; this.b = b_ ; this.c = c_ ; this.d = d_ ;
   }
   public mul(q: Quat): Quat { // Quaternion multiplication
      return new Quat(
           this.a * q.a - this.b * q.b - this.c * q.c - this.d * q.d,
           this.a * q.b + this.b * q.a + this.c * q.d - this.d * q.c,
           this.a * q.c - this.b * q.d + this.c * q.a + this.d * q.b,
           this.a * q.d + this.b * q.c - this.c * q.b + this.d * q.a) ;
   }
   public toString(): string {
      return "Q[" + this.a + "," + this.b + "," + this.c + "," + this.d + "]" ;
   }
   public dist(q: Quat): number { // Euclidean distance
      return Math.hypot(this.a - q.a, this.b - q.b, this.c - q.c, this.d - q.d) ;
   }
   public len(): number { // Euclidean length
      return Math.hypot(this.a, this.b, this.c, this.d) ;
   }
   public cross(q: Quat): Quat { // cross product
      return new Quat(0, this.c * q.d - this.d * q.c,
                  this.d * q.b - this.b * q.d, this.b * q.c - this.c * q.b) ;
   }
   public dot(q: Quat): number { // dot product of two quaternions
      return this.b * q.b + this.c * q.c + this.d * q.d ;
   }
   public normalize(): Quat { // make the magnitude be 1
      let d = Math.sqrt(this.dot(this)) ;
      return new Quat(this.a / d, this.b / d, this.c / d, this.d / d) ;
   }
   public makenormal(): Quat { // make a normal vector from a plane or quat or point
      return new Quat(0, this.b, this.c, this.d).normalize() ;
   }
   public normalizeplane(): Quat { // normalize a plane
      let d = Math.hypot(this.b, this.c, this.d) ;
      return new Quat(this.a / d, this.b / d, this.c / d, this.d / d) ;
   }
   public smul(m: number): Quat { // scalar multiplication
      return new Quat(this.a * m, this.b * m, this.c * m, this.d * m) ;
   }
   public sum(q: Quat): Quat { // quaternion sum
      return new Quat(this.a + q.a, this.b + q.b, this.c + q.c, this.d + q.d) ;
   }
   public sub(q: Quat): Quat { // difference
      return new Quat(this.a - q.a, this.b - q.b, this.c - q.c, this.d - q.d) ;
   }
   public angle(): number { // quaternion angle
      return 2 * Math.acos(this.a) ;
   }
   public invrot(): Quat { // quaternion inverse rotation
      return new Quat(this.a, -this.b, -this.c, -this.d) ;
   }
   public det3x3(a00: number, a01: number, a02: number, a10: number, a11: number,
          a12: number, a20: number, a21: number, a22: number): number {
      // 3x3 determinant
      return a00 * (a11 * a22 - a12 * a21) +
             a01 * (a12 * a20 - a10 * a22) +
             a02 * (a10 * a21 - a11 * a20) ;
   }
   public rotateplane(q: Quat): Quat { // rotate a plane using a quaternion
      let t = q.mul(new Quat(0, this.b, this.c, this.d)).mul(q.invrot()) ;
      t.a = this.a ;
      return t ;
   }
   public rotatepoint(q: Quat): Quat { // rotate a point
      return q.mul(this).mul(q.invrot()) ;
   }
   public rotateface(face: Quat[]): Quat[] { // rotate a face by this Q.
      let that = this ;
      return face.map((_: Quat) => _.rotatepoint(that)) ;
   }
   public rotatecubie(cubie: Quat[][]): Quat[][] { // rotate a cubie by this Q.
      let that = this ;
      return cubie.map((_: Quat[]) => that.rotateface(_)) ;
   }
   public intersect3(p2: Quat, p3: Quat) { // intersect three planes if there is one
      let det = this.det3x3(this.b, this.c, this.d,
                            p2.b, p2.c, p2.d,
                            p3.b, p3.c, p3.d) ;
      if (Math.abs(det) < Quat.eps) {
         return false ;
      }
      return new Quat(0,
                  this.det3x3(this.a, this.c, this.d,
                              p2.a, p2.c, p2.d, p3.a, p3.c, p3.d) / det,
                  this.det3x3(this.b, this.a, this.d,
                              p2.b, p2.a, p2.d, p3.b, p3.a, p3.d) / det,
                  this.det3x3(this.b, this.c, this.a,
                              p2.b, p2.c, p2.a, p3.b, p3.c, p3.a) / det) ;
   }
   public solvethreeplanes(p1: number, p2: number, p3: number, planes: Quat[]): any {
   // find intersection of three planes but only if interior
   // Takes three indices into a plane array, and returns the point at the
   // intersection of all three, but only if it is internal to all planes.
      let p = planes[p1].intersect3(planes[p2], planes[p3]) ;
      if (!p) {
         return p ;
      }
      for (let i = 0; i < planes.length; i++) {
         if (i != p1 && i != p2 && i != p3) {
            let dt = planes[i].b * p.b + planes[i].c * p.c + planes[i].d * p.d ;
            if ((planes[i].a > 0 && dt > planes[i].a) ||
                (planes[i].a < 0 && dt < planes[i].a)) {
               return false ;
            }
         }
      }
      return p ;
   }
   public side(x: number): number {
   // is this point close to the origin, or on one or the other side?
      if (x > Quat.eps) {
         return 1 ;
      }
      if (x < -Quat.eps) {
         return -1 ;
      }
      return 0 ;
   }
   public cutfaces(faces: Quat[][]): Quat[][] {
     // Cut a set of faces by a plane and return new set
      let that = this ; // welcome to Javascript
      let d = this.a ;
      let nfaces = [] ;
      for (let j = 0; j < faces.length; j++) {
         let face = faces[j] ;
         let inout = face.map((_: Quat) => that.side(_.dot(that) - d)) ;
         let seen = 0 ;
         for (let i = 0; i < inout.length; i++) {
            seen |= 1 << (inout[i] + 1) ;
         }
         if ((seen & 5) == 5) { // saw both sides
            for (let s = -1; s <= 1; s += 2) {
               let nface = [] ;
               for (let k = 0; k < face.length; k++) {
                  if (inout[k] == s || inout[k] == 0) {
                     nface.push(face[k]) ;
                  }
                  let kk = (k + 1) % face.length ;
                  if (inout[k] + inout[kk] == 0 && inout[k] != 0) {
                     let vk = face[k].dot(this) - d ;
                     let vkk = face[kk].dot(this) - d ;
                     let r = vk / (vk - vkk) ;
                     let pt = face[k].smul(1 - r).sum(face[kk].smul(r)) ;
                     nface.push(pt) ;
                  }
               }
               nfaces.push(nface) ;
            }
         } else { // no split
            nfaces.push(face) ;
         }
      }
      return nfaces ;
   }
   public faceside(face: Quat[]): number { // which side of a plane is a face on?
      let d = this.a ;
      for (let i = 0; i < face.length; i++) {
         let s = this.side(face[i].dot(this) - d) ;
         if (s != 0) {
            return s ;
         }
      }
      throw new Error("Could not determine side of plane in faceside") ;
   }
   public sameplane(p: Quat): boolean { // are two planes the same?
      let a = this.normalize() ;
      let b = p.normalize() ;
      return a.dist(b) < Quat.eps || a.dist(b.smul(-1)) < Quat.eps ;
   }
   public makecut(r: number): Quat { // make a cut from a normal vector
      return new Quat(r, this.b, this.c, this.d) ;
   }
}
