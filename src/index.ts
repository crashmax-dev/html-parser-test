import { got } from 'got'
import { parse } from 'node-html-parser'

interface Anime {
  title: string
  link: string
}

class ParseAnime {
  private baseUrl: string
  private animeUrl: string

  constructor() {
    this.baseUrl = 'https://naruto-base.su'
    this.animeUrl = `${this.baseUrl}/novosti/drugoe_anime_ru`
  }

  async parse(maxPages: number) {
    const anime = await this.parsePages(maxPages)
    return await this.parseAnime(anime)
  }

  private async parseAnime(pages: Anime[]) {
    const links = pages.map((page) => this.loadHTML(page.link))
    console.time('parseAnime')
    const anime = await Promise.all(links)
    console.timeEnd('parseAnime')

    const parsedAnime = anime.map((html) => {
      const root = parse(html)
      const title = root.querySelector('h1[itemprop="name"]')!.textContent
      const link = root.querySelector('a[id="ep6"]')
      const videoid = link?.attributes['onclick']?.split('\'')[1] ?? null

      return {
        title,
        videoid
      }
    })

    return parsedAnime
  }

  private async parsePages(maxPages: number): Promise<Anime[]> {
    const links = Array.from(
      { length: maxPages },
      (_, page) => this.loadHTML(`${this.animeUrl}/?page${page + 1}`)
    )

    console.time('parsePages')
    const pages = await Promise.all(links)
    console.timeEnd('parsePages')
    const parsedPages = pages.flatMap((html) => {
      const root = parse(html)
      const links = root.querySelectorAll('h2 > a')

      return links.map((el) => {
        return {
          title: el.textContent,
          link: this.baseUrl + el.attributes['href']!
        }
      })
    })

    return parsedPages
  }

  private async loadHTML(url: string): Promise<string> {
    try {
      return await got(url).text()
    } catch (err) {
      console.log(err)
      return ''
    }
  }
}

const anime = new ParseAnime()
console.time('parse')
const data = await anime.parse(20)
console.timeEnd('parse')
