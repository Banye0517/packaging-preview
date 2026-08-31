export function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('无法读取图片数据'))
    }
    reader.onerror = () => reject(new Error('无法读取图片数据'))
    reader.readAsDataURL(file)
  })
}
