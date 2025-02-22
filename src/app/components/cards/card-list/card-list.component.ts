import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardService } from '../../../services/card.service';
import { Card } from '../../../models/card';
import { SearchBarComponent } from '../../search-bar/search-bar.component';
import { CardDetailComponent } from '../card-detail/card-detail.component';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, CardDetailComponent],
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss']
})
export class CardListComponent implements OnInit, AfterViewInit {
  cards: Card[] = [];
  currentPage = 1;
  limit = 36;
  totalPages = 1;
  loading = false;

  currentExpansionIndex = 0;
  expansionCodes!: string[];

  showModal = false;
  selectedCard?: Card;
  
  // Modo búsqueda y filtros
  searchMode: boolean = false;
  searchFilters: any = {};

  @ViewChild('scrollTrigger') scrollTrigger!: ElementRef;
  private intersectionObserver!: IntersectionObserver;

  constructor(private cardService: CardService) {}

  ngOnInit(): void {
    this.expansionCodes = [
      this.cardService.opCodes.OP01,
      this.cardService.opCodes.OP02,
      this.cardService.opCodes.OP03,
      this.cardService.opCodes.OP04,
      this.cardService.opCodes.OP05,
      this.cardService.opCodes.OP06,
      this.cardService.opCodes.OP07,
      this.cardService.opCodes.OP08,
      this.cardService.opCodes.OP09,
      this.cardService.ebCode,
      ...Object.values(this.cardService.stCodes)
    ];
    this.loadCards();
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && this.scrollTrigger) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            if (this.searchMode) {
              this.loadSearchCards();
            } else {
              this.loadCards();
            }
          }
        },
        { root: null, threshold: 0.1 }
      );
      this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
    }
  }

  loadCards(): void {
    if (this.loading) return;
    if (this.currentExpansionIndex >= this.expansionCodes.length) return;

    this.loading = true;
    const codePrefix = this.expansionCodes[this.currentExpansionIndex];

    this.cardService.getCardsByCode(codePrefix, this.currentPage, this.limit).subscribe({
      next: res => {
        this.totalPages = res.totalPages;
        if (res.data.length === 0 || this.currentPage > this.totalPages) {
          this.currentExpansionIndex++;
          this.currentPage = 1;
          this.loading = false;
          this.loadCards();
          return;
        }
        this.cards = this.cards.concat(res.data);
        this.currentPage++;
        this.loading = false;
        if (this.intersectionObserver && this.scrollTrigger) {
          this.intersectionObserver.unobserve(this.scrollTrigger.nativeElement);
          this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
        }
      },
      error: err => {
        console.error('Error al obtener las cartas:', err);
        this.loading = false;
      }
    });
  }

  loadSearchCards(): void {
    if (this.loading) return;
    if (this.currentPage > this.totalPages) return;

    this.loading = true;
    this.cardService.searchCards(this.searchFilters, this.currentPage, this.limit).subscribe({
      next: res => {
        this.totalPages = res.totalPages;
        // Si no se encontraron cartas y es la primera página, se mostrará el mensaje
        if(this.currentPage === 1 && res.data.length === 0){
          this.cards = [];
        } else {
          this.cards = this.cards.concat(res.data);
          this.currentPage++;
        }
        this.loading = false;
        if (this.intersectionObserver && this.scrollTrigger) {
          this.intersectionObserver.unobserve(this.scrollTrigger.nativeElement);
          this.intersectionObserver.observe(this.scrollTrigger.nativeElement);
        }
      },
      error: err => {
        console.error('Error al buscar cartas:', err);
        this.loading = false;
      }
    });
  }

  // Ahora onSearch recibe un objeto con nombre y filtros
  onSearch(searchData: any): void {
    if (!searchData.name && !Object.values(searchData).some(val => val)) {
      // Se desactiva el modo búsqueda y se restablece la lista original
      this.searchMode = false;
      this.cards = [];
      this.currentExpansionIndex = 0;
      this.currentPage = 1;
      this.loadCards();
      return;
    }

    this.searchMode = true;
    this.searchFilters = { ...searchData };
    this.cards = [];
    this.currentPage = 1;
    this.loadSearchCards();
  }

  openModal(card: Card): void {
    this.selectedCard = card;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCard = undefined;
  }
  
  previousCard(): void {
    if (!this.selectedCard || this.cards.length === 0) return;
    const currentIndex = this.cards.findIndex(c => c.id === this.selectedCard!.id);
    if (currentIndex > 0) {
      this.selectedCard = this.cards[currentIndex - 1];
    }
  }

  nextCard(): void {
    if (!this.selectedCard || this.cards.length === 0) return;
    const currentIndex = this.cards.findIndex(c => c.id === this.selectedCard!.id);
    if (currentIndex >= 0 && currentIndex < this.cards.length - 1) {
      this.selectedCard = this.cards[currentIndex + 1];
    }
  }
}
